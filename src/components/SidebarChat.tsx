'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Smile, Paperclip, MessageSquare } from 'lucide-react';

export default function SidebarChat({ profile, role }: { profile: any; role: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const targetDoctorId = role === 'doctor' ? profile?.id : profile?.doctor_id;

  useEffect(() => {
    if (!profile?.id || !targetDoctorId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*, profiles ( name, avatar_url )')
        .eq('doctor_id', targetDoctorId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to realtime Chat Messages
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages'
      }, async (payload) => {
        if (payload.new.doctor_id !== targetDoctorId) return; // Filtrar por médico

        // Fetch sender name
        const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', payload.new.from_user_id).single();
        
        setMessages((prev) => {
           // Intercambiar mensaje optimístico por el real
           const base = prev.filter(m => !(m.isOptimistic && m.message === payload.new.message && m.from_user_id === payload.new.from_user_id));
           if (base.some(m => m.id === payload.new.id)) return prev; // ya existe
           return [...base, { ...payload.new, profiles: sender }];
        });
      })
      .subscribe();

    // Fetch patients for mentions
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, name').limit(50);
      if (data) setPatients(data);
    };
    fetchPatients();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, targetDoctorId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !targetDoctorId) return;

    const msgText = input;
    setInput(''); // Limpiar caja instantáneamente

    // Respuesta Optimista
    const tempMessage = {
      id: Math.random().toString(),
      doctor_id: targetDoctorId,
      from_user_id: profile.id,
      message: msgText,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      profiles: { name: profile.name, avatar_url: profile.avatar_url }
    };

    setMessages((prev) => [...prev, tempMessage]);

    const { error } = await supabase.from('chat_messages').insert([{
      doctor_id: targetDoctorId,
      from_user_id: profile.id,
      message: msgText,
    }]);

    if (error) {
       console.error("Error sending message:", error);
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

  return (
    <div className="mx-2.5 mb-2 mt-auto bg-white rounded-xl border border-gray-100 shadow-sm h-[340px] flex flex-col overflow-hidden z-50 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="px-2.5 py-2 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <span className="text-[10px] font-bold text-[#1A4A8A] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {role === 'doctor' ? 'Conexión Asistente' : 'Médico Asignado'}
        </span>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2.5 flex flex-col scrollbar-thin bg-gray-50/30">
        {messages.map((m, i) => {
          const isMe = m.from_user_id === profile?.id;
          const avatar = m.profiles?.avatar_url;
          const nameInitial = m.profiles?.name ? m.profiles.name[0].toUpperCase() : '?';

          return (
            <div key={i} className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                avatar ? (
                  <img src={avatar} className="w-5 h-5 rounded-full border border-gray-200 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-[8px] flex-shrink-0">
                    {nameInitial}
                  </div>
                )
              )}
              <div className={`p-2 rounded-2xl max-w-[80%] shadow-sm text-balance ${isMe ? 'bg-[#0084FF] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100/80'}`}>
                {!isMe && <span className="block text-[6px] font-bold opacity-60 mb-0.5">{m.profiles?.name || 'Usuario'}</span>}
                <p className="text-[10px] leading-snug break-words">{m.message}</p>
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
              <button key={p.id} onClick={() => selectMention(p.name)} className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-[#F4F7FB] text-gray-700 transition-colors flex items-center gap-1">
                <span className="font-bold text-blue-500">@</span>{p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Form Area */}
      <div className="p-2 border-t border-gray-50 bg-[#F8FAFC] flex items-center gap-1.5">
        <div className="flex-1 bg-white flex items-center px-2 py-1.5 rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
           <input 
             type="text" 
             value={input}
             onChange={handleInputChange}
             placeholder="Escribe... (@)" 
             className="w-full bg-transparent text-[10px] focus:outline-none placeholder-gray-400"
             onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
           />
        </div>
        <button onClick={sendMessage} className="p-1.5 bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-xl flex-shrink-0 shadow-sm transition-transform active:scale-95 flex items-center justify-center">
          <Send size={12} className="transform -rotate-12" />
        </button>
      </div>
    </div>
  );
}
