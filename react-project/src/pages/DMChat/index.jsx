import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../../context';
import MyBookClubsSidebar from '../../components/features/bookclub/MyBookClubsSidebar';
import DMSidebar from '../../components/features/bookclub/SideBar/DMSidebar';
import DMChat from '../../components/features/bookclub/MainChatArea/DMChat';

const DMChatPage = () => {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const { userId } = useParams();
  
  const [conversations, setConversations] = useState([]);
  const [currentDMUser, setCurrentDMUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [friends, setFriends] = useState([]);
  const [myBookClubs, setMyBookClubs] = useState([]);
  
  const dmWs = useRef(null);

  // Fetch my bookclubs for sidebar
  useEffect(() => {
    if (auth?.user) {
      const headers = auth?.token 
        ? { Authorization: `Bearer ${auth.token}` }
        : {};
      
      fetch('http://localhost:3000/v1/bookclubs/discover', { headers })
        .then(response => response.json())
        .then(data => {
          const clubs = data.success ? data.data : (data.bookClubs || []);
          const myClubs = clubs.filter(club => 
            club.creatorId === auth.user.id || club.isMember === true
          );
          setMyBookClubs(myClubs);
        })
        .catch(error => console.error('Error fetching my book clubs:', error));
    }
  }, [auth]);

  // DM WebSocket connection
  useEffect(() => {
    if (!auth?.user?.id || !auth?.user?.name || !auth?.token) return;

    const ws = new WebSocket('ws://localhost:4000');
    dmWs.current = ws;

    ws.onopen = () => {
      console.log('📨 DM WebSocket connected');
      ws.send(JSON.stringify({
        type: 'join-dm',
        userId: auth.user.id,
        username: auth.user.name,
        token: auth.token
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'dm-joined':
          console.log('✅ Joined DM connection');
          break;
          
        case 'auth-error':
          console.error('❌ DM auth failed:', data.message);
          break;
          
        case 'dm-sent':
          setDmMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          setSendingMessage(false);
          break;
          
        case 'dm-received':
          const newMsg = data.message;
          
          if (currentDMUser && (newMsg.senderId === currentDMUser.id || newMsg.receiverId === currentDMUser.id)) {
            setDmMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          
          fetchConversations();
          break;
                  case 'dm-deleted':
          // Handle message deletion from WebSocket
          setDmMessages(prev => 
            prev.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, content: '[Message deleted]', deletedAt: new Date().toISOString(), attachments: [] }
                : msg
            )
          );
          break;
                  case 'dm-deleted':
          // Handle message deletion from WebSocket
          setDmMessages(prev => 
            prev.map(msg => 
              msg.id === data.messageId 
                ? { ...msg, content: '[Message deleted]', deletedAt: new Date().toISOString(), attachments: [] }
                : msg
            )
          );
          break;
          
        case 'error':
          console.error('WebSocket error:', data.message);
          setSendingMessage(false);
          alert(data.message || 'Failed to send message');
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('DM WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('📪 DM WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [auth?.user?.id, auth?.user?.name, auth?.token, currentDMUser]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch('http://localhost:3000/v1/messages/conversations', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // Fetch friends list
  const fetchFriends = async () => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch('http://localhost:3000/v1/friends/list', {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setFriends(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, [auth]);

  // Handle userId from URL params
  useEffect(() => {
    if (userId && auth?.token) {
      handleSelectDMConversation(userId);
    }
  }, [userId, auth?.token]);

  // Check for DM intent from sessionStorage
  useEffect(() => {
    const dmIntent = sessionStorage.getItem('openDM');
    if (dmIntent && auth?.user) {
      try {
        const { userId: intentUserId } = JSON.parse(dmIntent);
        sessionStorage.removeItem('openDM');
        navigate(`/dm/${intentUserId}`);
      } catch (err) {
        console.error('Error parsing DM intent:', err);
        sessionStorage.removeItem('openDM');
      }
    }
  }, [auth]);

  // Fetch messages for selected DM conversation
  const fetchDMMessages = async (userId) => {
    if (!auth?.token) return;
    
    try {
      const response = await fetch(`http://localhost:3000/v1/messages/${userId}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        const messagesInOrder = [...(data.data.messages || [])].reverse();
        setDmMessages(messagesInOrder);
        setCurrentDMUser(data.data.otherUser);
        
        // Mark conversation as read
        await markConversationAsRead(userId);
      } else {
        const userFromConv = conversations.find(c => c.friend?.id === userId)?.friend;
        if (userFromConv) {
          setCurrentDMUser(userFromConv);
          setDmMessages([]);
          
          // Mark conversation as read even if no messages yet
          await markConversationAsRead(userId);
        }
      }
    } catch (err) {
      console.error('Error fetching DM messages:', err);
    }
  };

  const markConversationAsRead = async (userId) => {
    if (!auth?.token) return;
    
    try {
      await fetch(`http://localhost:3000/v1/messages/${userId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      
      // Update local conversation state to set unreadCount to 0
      setConversations(prev => 
        prev.map(conv => 
          conv.friend?.id === userId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  const handleSelectDMConversation = async (userId) => {
    navigate(`/dm/${userId}`, { replace: true });
    await fetchDMMessages(userId);
  };

  const handleSendDM = (content, attachments = []) => {
    if ((!content || !content.trim()) && attachments.length === 0) {
      return;
    }
    
    if (sendingMessage || !dmWs.current || dmWs.current.readyState !== WebSocket.OPEN || !currentDMUser) {
      return;
    }

    setSendingMessage(true);
    
    dmWs.current.send(JSON.stringify({
      type: 'dm-message',
      receiverId: currentDMUser.id,
      content: content?.trim() || '',
      attachments: attachments
    }));
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <div className='flex justify-center'>
        {/* My Bookclubs Sidebar */}
        <MyBookClubsSidebar 
          bookClubs={myBookClubs}
          viewMode="dm"
          onSelectBookClub={(id) => navigate(`/bookclub/${id}`)}
          onOpenDM={() => {}} // Already in DM mode
          auth={auth}
        />
        
        {/* DM Conversations Sidebar */}
        <DMSidebar
          conversations={conversations}
          friends={friends}
          currentConversation={currentDMUser?.id}
          onSelectConversation={handleSelectDMConversation}
          onStartConversation={handleSelectDMConversation}
          onBackToBookclub={() => navigate('/')}
          auth={auth}
        />
      </div>
      
      <div className="flex flex-1">
        {/* DM Chat Area */}
        <DMChat
          otherUser={currentDMUser}
          messages={dmMessages}
          onSendMessage={handleSendDM}
          auth={auth}
          setMessages={setDmMessages}
          dmWs={dmWs}
        />
      </div>
    </div>
  );
};

export default DMChatPage;
