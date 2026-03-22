'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Smile, Paperclip, MessageSquare, ChevronDown } from 'lucide-react';

export default function SidebarChat({ profile, role }: { profile: any; role: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [targetProfileName, setTargetProfileName] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});

  const selectedUserIdRef = useRef<string | null>(null);
  const isOpenRef = useRef(false);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  const playNotifySound = () => {
     try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // Nota discreta
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); // Volumen bajo

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.12);
     } catch (e) {}
  };

  const targetDoctorId = role === 'doctor' ? profile?.id : profile?.doctor_id;

  // 1. Cargar usuarios del sistema y listado para menciones
  useEffect(() => {
    if (!profile?.id) return;
    
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, role')
        .neq('id', profile.id); // Excluirme a mí mismo
      
      if (data && data.length > 0) {
         setUsers(data);
         // Seleccionar el primero por defecto o al doctor vinculado
         const defaultTarget = targetDoctorId && targetDoctorId !== profile.id 
           ? data.find(u => u.id === targetDoctorId) 
           : (data.find(u => u.role === 'doctor') || data[0]);
           
         if (defaultTarget) {
            setSelectedUserId(defaultTarget.id);
            setTargetProfileName(defaultTarget.name);
         }
      }
    };
    fetchUsers();

    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, name').limit(50);
      if (data) setPatients(data);
    };
    fetchPatients();
  }, [profile?.id, targetDoctorId]);

  // 2. Cargar mensajes cuando cambia selectedUserId
  useEffect(() => {
    if (!profile?.id || !selectedUserId) return;

    const userObj = users.find(u => u.id === selectedUserId);
    if (userObj) setTargetProfileName(userObj.name);

    setMessages([]); 
    setIsInitialLoad(true);
    setHasMore(true);

    // Limpiar contador de este usuario al abrir su chat
    setUnreadCounts(prev => {
       const copy = { ...prev };
       delete copy[selectedUserId];
       return copy;
    });

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(from_user_id.eq.${profile.id},doctor_id.eq.${selectedUserId}),and(from_user_id.eq.${selectedUserId},doctor_id.eq.${profile.id})`)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) {
         console.error("Error fetching messages:", error);
         return;
      }

      if (data) {
         const inverted = [...data].reverse();
         const enriched = await Promise.all(inverted.map(async (m) => {
            const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', m.from_user_id).single();
            return { ...m, profiles: sender };
         }));
         setMessages(enriched);
         if (data.length < 25) setHasMore(false);
      }
    };
    fetchMessages();
  }, [profile?.id, selectedUserId]);

  // 3. Suscripción Global a mensajes para Notificaciones
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`public:all_messages:${profile.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages'
      }, async (payload) => {
        const senderId = payload.new.from_user_id;
        const receiverId = payload.new.doctor_id;

        const currentId = selectedUserIdRef.current;
        const oOpen = isOpenRef.current;

        if (receiverId !== profile.id && senderId !== profile.id) return;

        // Si el mensaje es para mí
        if (receiverId === profile.id) {
           if (!oOpen || senderId !== currentId) {
              setUnreadCounts(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
              playNotifySound();
           }
        }

        const isFromCurrentTarget = senderId === currentId && receiverId === profile.id;
        const isFromMe = senderId === profile.id && receiverId === currentId;

        if (isFromCurrentTarget || isFromMe) {
           const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', senderId).single();
           setMessages((prev) => {
              const base = prev.filter(m => !(m.isOptimistic && m.message === payload.new.message));
              if (base.some(m => m.id === payload.new.id)) return prev;
              return [...base, { ...payload.new, profiles: sender }];
           });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Calcular unreadCount global
  useEffect(() => {
     const total = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);
     if (total === 0) {
        setUnreadCount(0);
     } else {
        setUnreadCount(total);
     }
  }, [unreadCounts]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isPrependRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPrependRef.current) return;

    if (messagesEndRef.current && messages.length > 0) {
       const timer = setTimeout(() => {
          if (messagesEndRef.current) {
             messagesEndRef.current.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
             if (isInitialLoad) setIsInitialLoad(false);
          }
       }, 150);
       
       return () => clearTimeout(timer);

    }
  }, [messages, isInitialLoad]);

  const fetchOlderMessages = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldest = messages.find(m => !m.isOptimistic);
    if (!oldest) { setLoadingMore(false); return; }

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(from_user_id.eq.${profile.id},doctor_id.eq.${selectedUserId}),and(from_user_id.eq.${selectedUserId},doctor_id.eq.${profile.id})`)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(25);

    if (data && data.length > 0) {
       const inverted = [...data].reverse();
       const enriched = await Promise.all(inverted.map(async (m) => {
          const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', m.from_user_id).single();
          return { ...m, profiles: sender };
       }));
       
       const container = scrollContainerRef.current;
       const currentScrollHeight = container ? container.scrollHeight : 0;
       
       isPrependRef.current = true;
       setMessages(prev => [...enriched, ...prev]);

       // Restaurar la posición del scroll exactamente donde estaba
       setTimeout(() => {
          if (container) {
             const newScrollHeight = container.scrollHeight;
             container.scrollTop = newScrollHeight - currentScrollHeight;
          }
          isPrependRef.current = false;
       }, 50);

       if (data.length < 25) setHasMore(false);
    } else {
       setHasMore(false);
    }
    setLoadingMore(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedUserId) return;

    const msgText = input;
    setInput(''); // Limpiar caja instantáneamente

    // Respuesta Optimista
    const tempMessage = {
      id: Math.random().toString(),
      doctor_id: selectedUserId,
      from_user_id: profile.id,
      message: msgText,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      profiles: { name: profile.name, avatar_url: profile.avatar_url }
    };

    setMessages((prev) => [...prev, tempMessage]);

    const { error } = await supabase.from('chat_messages').insert([{
      doctor_id: selectedUserId,
      clinic_id: profile.clinic_id, 
      from_user_id: profile.id,
      message: msgText,
    }]);

    if (error) {
       console.error("Error sending message:", error);
       alert("Error al enviar mensaje (posible restricción RLS): " + (error.message || "Insert fallido"));
       setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const match = val.match(/@(\w*)$/);
    if (match) {
      setShowMention(true);
      const query = match[1].toLowerCase();
      setFilteredPatients(patients.filter(p => p.name.toLowerCase().includes(query)));
    } else {
      setShowMention(false);
    }
  };

  const selectMention = (name: string) => {
    setInput(prev => prev.replace(/@\w*$/, `@${name} `));
    setShowMention(false);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
       setIsInitialLoad(true); 
       
       if (selectedUserId) {
          setUnreadCounts(prev => {
             const copy = { ...prev };
             delete copy[selectedUserId];
             return copy;
          });
       }

       const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
             scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
       }, 300); 

       return () => clearTimeout(timer);
    }
  }, [isOpen, selectedUserId]);

  // El chat flotará en la esquina inferior derecha para no saturar el sidebar en laptops de 13"
  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 bg-[#0084FF] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#0073E6] transition-all flex items-center justify-center z-50 active:scale-95 group border-2 border-white/20 duration-1000 ${unreadCount > 0 ? 'animate-bounce' : ''}`}
        >
          <MessageSquare size={20} className="group-hover:animate-pulse" />
          {unreadCount > 0 && (
             <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg animate-pulse">
               {unreadCount}
             </div>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl border border-gray-100 shadow-2xl h-[420px] w-[340px] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-6 fade-in-20 duration-200">
          {/* Header */}
          <div className="px-3.5 py-3 border-b border-gray-50 flex justify-between items-center bg-[#1A4A8A] text-white relative">
            <div 
              className="flex items-center gap-1.5 cursor-pointer hover:bg-white/10 px-1.5 py-1 rounded-lg transition-colors"
              onClick={() => setShowUsersDropdown(!showUsersDropdown)}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold flex items-center gap-1">
                {targetProfileName || 'Seleccionar Usuario'}
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform ${showUsersDropdown ? 'rotate-180' : ''}`} />
              </span>
            </div>

            {/* Users Dropdown */}
            {showUsersDropdown && (
              <div className="absolute top-11 left-2 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 z-50 w-60 max-h-48 overflow-y-auto divide-y divide-gray-50 flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
                {users.map((u) => {
                  const uCount = unreadCounts[u.id] || 0;
                  return (
                    <button 
                      key={u.id} 
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setShowUsersDropdown(false);
                      }} 
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F4F7FB] flex items-center justify-between transition-colors ${selectedUserId === u.id ? 'bg-blue-50/70 font-bold text-[#1A4A8A]' : 'text-gray-700'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {uCount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black scale-90 shadow-sm animate-pulse">
                            {uCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-gray-400">
                        {u.role === 'doctor' ? 'Doc' : u.role === 'assistant' ? 'Asis' : u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-transform active:scale-95">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages List Area */}
          <div 
            ref={scrollContainerRef}
            onScroll={(e) => {
               if (e.currentTarget.scrollTop === 0) {
                  fetchOlderMessages();
               }
            }}
            className="flex-1 overflow-y-auto space-y-3 p-3 flex flex-col scrollbar-thin bg-gray-50/50"
          >
            {loadingMore && <div className="text-center text-[10px] text-gray-400">Cargando anteriores...</div>}
            {messages.map((m, i) => {
              const isMe = m.from_user_id === profile?.id;
              const avatar = m.profiles?.avatar_url;
              const nameInitial = m.profiles?.name ? m.profiles.name[0].toUpperCase() : '?';

              const prevMsg = messages[i - 1];
              const showDateDivider = !prevMsg || new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
              const formattedDate = new Date(m.created_at).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
              const formattedTime = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={m.id || i} className="flex flex-col">
                  {showDateDivider && (
                    <div className="flex justify-center my-2">
                      <span className="bg-gray-200/60 text-gray-500 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {formattedDate}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      avatar ? (
                        <img src={avatar} className="w-6 h-6 rounded-full border border-gray-200 object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center font-bold text-[#1A4A8A] text-[10px] flex-shrink-0 border border-blue-200/50">
                          {nameInitial}
                        </div>
                      )
                    )}
                    <div className={`p-2.5 rounded-2xl max-w-[80%] shadow-sm text-balance ${isMe ? 'bg-[#0084FF] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                      {!isMe && <span className="block text-[10px] font-bold text-gray-400 mb-0.5">{m.profiles?.name || 'Usuario'}</span>}
                      <p className="text-sm leading-snug break-words">{m.message}</p>
                      <span className={`block text-[9px] mt-0.5 ${isMe ? 'text-white/70 text-right' : 'text-gray-400 text-left'}`}>
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Mention Dropdown wrapper */}
          <div className="relative">
            {showMention && filteredPatients.length > 0 && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-24 overflow-y-auto divide-y divide-gray-50 flex flex-col animate-in slide-in-from-bottom-2 duration-150">
                {filteredPatients.map((p) => (
                  <button key={p.id} onClick={() => selectMention(p.name)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-[#F4F7FB] text-gray-700 transition-colors flex items-center gap-1">
                    <span className="font-bold text-blue-500">@</span>{p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input Form Area */}
          <div className="p-3 border-t border-gray-50 bg-white flex items-center gap-2">
            <div className="flex-1 bg-gray-100/70 flex items-center px-3 py-2 rounded-2xl border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all shadow-inner overflow-hidden">
               <input 
                 type="text" 
                 value={input}
                 onChange={handleInputChange}
                 placeholder="Escribe un mensaje... (@)" 
                 className="w-full bg-transparent text-xs focus:outline-none placeholder-gray-400 text-gray-800"
                 onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               />
            </div>
            <button onClick={sendMessage} className="p-2 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl flex-shrink-0 shadow-md transition-transform active:scale-95 flex items-center justify-center">
              <Send size={15} className="transform -rotate-12" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
