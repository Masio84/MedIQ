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
        .select('*, profiles ( name )')
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

        // Fetch sender name to avoid missing profile.name
        const { data: sender } = await supabase.from('profiles').select('name').eq('id', payload.new.from_user_id).single();
        
        setMessages((prev) => {
           if (prev.some(m => m.id === payload.new.id || (m.from_user_id === payload.new.from_user_id && m.message === payload.new.message && Math.abs(new Date(m.created_at).getTime() - new Date(payload.new.created_at).getTime()) < 3000))) {
              return prev; // evitar duplicados optimistas
           }
           return [...prev, { ...payload.new, profiles: sender }];
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
      profiles: { name: profile.name }
    };

    setMessages((prev) => [...prev, tempMessage]);

    const { error } = await supabase.from('chat_messages').insert([{
      doctor_id: targetDoctorId,
      from_user_id: profile.id,
      message: msgText,
    }]);

    if (error) {
       console.error("Error sending message:", error);
       // Remover si falló para evitar ghosting
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

  // El chat siempre está abierto, no hay isOpen condicional
  return (
    <div className="border-t border-gray-100 p-3 bg-white space-y-2 mt-auto h-[350px] flex flex-col z-50">
      <div className="flex justify-between items-center border-b pb-1">
        <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Chat {role === 'doctor' ? 'con Asistente' : 'con Dr.'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-1 text-xxs flex flex-col">
        {messages.map((m, i) => {
          const isMe = m.from_user_id === profile?.id;
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`p-2 rounded-lg max-w-[85%] shadow-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {!isMe && <span className="block text-[7px] font-bold opacity-75 mb-0.5">{m.profiles?.name || 'Usuario'}</span>}
                <p className="text-xxs leading-snug">{m.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative border-t pt-2 flex items-center gap-1">
        {showMention && filteredPatients.length > 0 && (
          <div className="absolute bottom-10 left-0 w-full bg-white border rounded-lg shadow-lg z-50 max-h-24 overflow-y-auto">
            {filteredPatients.map((p) => (
              <button key={p.id} onClick={() => selectMention(p.name)} className="w-full text-left p-1 text-xxs hover:bg-gray-50 text-gray-700">
                @{p.name}
              </button>
            ))}
          </div>
        )}
        <input 
          type="text" 
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe... (@mencionar)" 
          className="flex-1 p-1 border border-gray-100 rounded text-xxs focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="p-1 bg-blue-600 text-white rounded">
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
