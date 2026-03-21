'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import type { Message, ActivityFeedItem } from '@/lib/types';
import Link from 'next/link';

type TimelineItem = {
  id: string;
  type: 'message' | 'activity';
  content: string;
  sender_id?: string;
  message_type?: string;
  emoji?: string;
  created_at: string;
};

export default function ChatPage() {
  const { profile, partner } = useAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;
    loadTimeline();

    // Realtime subscription for messages
    const msgChannel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${profile.id}`,
      }, () => { loadTimeline(); })
      .subscribe();

    // Realtime for activity feed
    const actChannel = supabase
      .channel('activity-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed',
      }, () => { loadTimeline(); })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(actChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTimeline = async () => {
    if (!profile) return;

    // Load messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: true })
      .limit(100);

    // Load activity feed
    const { data: activities } = await supabase
      .from('activity_feed')
      .select('*')
      .or(`user_id.eq.${profile.id},partner_id.eq.${profile.id}`)
      .order('created_at', { ascending: true })
      .limit(50);

    const timeline: TimelineItem[] = [];

    if (messages) {
      messages.forEach(msg => {
        timeline.push({
          id: msg.id,
          type: 'message',
          content: msg.content,
          sender_id: msg.sender_id,
          message_type: msg.message_type,
          created_at: msg.created_at,
        });
      });
    }

    if (activities) {
      activities.forEach(act => {
        timeline.push({
          id: act.id,
          type: 'activity',
          content: act.content,
          emoji: act.emoji || undefined,
          sender_id: act.user_id,
          created_at: act.created_at,
        });
      });
    }

    timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setItems(timeline);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !partner || !newMessage.trim() || sending) return;

    setSending(true);
    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      content: newMessage.trim(),
      message_type: 'text',
    });

    setNewMessage('');
    setSending(false);
    loadTimeline();
  };

  const sendHug = async () => {
    if (!profile || !partner) return;
    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      content: '🫂 Sent you a warm hug! ❤️',
      message_type: 'hug',
    });
    await supabase.from('notifications').insert({
      user_id: partner.id,
      title: 'Warm hug incoming! 🫂',
      body: `${profile.name} sent you a hug ❤️`,
      type: 'mood',
    });
    loadTimeline();
  };

  const sendNudge = async () => {
    if (!profile || !partner) return;
    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      content: '👉 Gentle nudge! Don\'t forget your tasks! 💕',
      message_type: 'nudge',
    });
    await supabase.from('nudges').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      message: 'Don\'t forget your tasks! 💕',
    });
    loadTimeline();
  };

  if (!partner) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💌</div>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>No Partner Yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Connect with your partner first to start chatting!
        </p>
        <Link href="/partner" className="btn btn-primary">Go to Partner Page →</Link>
      </div>
    );
  }

  return (
    <div className="chat-container animate-fade-in">
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'var(--gradient-warm)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, color: 'white',
          }}>
            {partner.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{partner.name}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your partner 💕</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={sendHug} className="btn btn-sm btn-secondary" title="Send Hug">
            🫂 Hug
          </button>
          <button onClick={sendNudge} className="btn btn-sm btn-secondary" title="Send Nudge">
            👉 Nudge
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>💬</p>
            <p>Start your conversation! Say something nice 💕</p>
          </div>
        ) : (
          items.map(item => {
            if (item.type === 'activity') {
              return (
                <div key={item.id} className="message-system">
                  {item.emoji} {item.content}
                  <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.6 }}>
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
              );
            }

            const isOwn = item.sender_id === profile?.id;
            const isSpecial = item.message_type === 'hug' || item.message_type === 'nudge';

            if (isSpecial) {
              return (
                <div key={item.id} className="message-system" style={{
                  background: item.message_type === 'hug'
                    ? 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(139,92,246,0.1))'
                    : 'var(--bg-glass)',
                  border: '1px solid',
                  borderColor: item.message_type === 'hug' ? 'rgba(236,72,153,0.2)' : 'var(--border-subtle)',
                }}>
                  {item.content}
                </div>
              );
            }

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                <div className={`message-bubble ${isOwn ? 'message-own' : 'message-partner'}`}>
                  {item.content}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="chat-input-bar">
        <input
          className="input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
          {sending ? '...' : '→'}
        </button>
      </form>
    </div>
  );
}
