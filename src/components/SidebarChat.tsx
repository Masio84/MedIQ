'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, Smile, Paperclip, MessageSquare } from 'lucide-react';

export default function SidebarChat({ profile, role }: { profile: any; role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile?.id) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: true })
        .limit(30);

      if (data) setMessages(data);
    };

    fetchMessages();

    // Subscribe to realtime Chat Messages
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
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
  }, [profile?.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    await supabase.from('chat_messages').insert([{
      clinic_id: profile.clinic_id,
      from_user_id: profile.id,
      message: input,
    }]);

    setInput('');
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

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-[#1A4A8A] text-white p-3 rounded-full shadow-lg hover:bg-[#1A4A8A]/90 transition-all flex items-center justify-center gap-2 z-50 md:relative md:bottom-auto md:right-auto md:m-4 md:rounded-xl md:py-2 md:w-[88%]"
      >
        <MessageSquare size={16} />
        <span className="text-xs font-bold">Chat de Clínica</span>
      </button>
    );
  }

  return (
    <div className="border-t border-gray-100 p-3 bg-white space-y-2 mt-auto h-[350px] flex flex-col z-50">
      <div className="flex justify-between items-center border-b pb-1">
        <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Chat Grupal
        </span>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-900 text-xxs font-bold">Cerrar</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-1 text-xxs flex flex-col">
        {messages.map((m, i) => {
          const isMe = m.from_user_id === profile?.id;
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`p-2 rounded-lg max-w-[85%] ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {m.message}
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
          className="flex-1 p-1 borders border-gray-100 rounded text-xxs focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="p-1 bg-blue-600 text-white rounded">
          <Send size={12} />
        </button>
      </div>
    </div>
  );
}
