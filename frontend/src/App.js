import React, { useState, useEffect, useRef } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Image URLs from the live site
const IMAGES = {
  hero: "https://tune-stage.preview.emergentagent.com/api/uploads/images/f1c2950b-a4c0-46cd-9180-0511a19ff3ed.jpg",
  album: "https://customer-assets.emergentagent.com/job_helper-upload-issue/artifacts/unc8lw89_Darko%20%26%20Sophia%20-%20Cover%20Art%20%28PNG3%29.jpg",
  erich: "https://customer-assets.emergentagent.com/job_helper-upload-issue/artifacts/jk04fq3e_2.png",
  arica: "https://customer-assets.emergentagent.com/job_helper-upload-issue/artifacts/duduele8_Arica%20Western%20Doorway%20looking%20down.jpg"
};

// Video URL for hero background - blue sky with moving clouds
const HERO_VIDEO = `${BACKEND_URL}/api/uploads/sky_video.mp4`;

// Track data
const TRACKS = [
  { 
    number: 1, 
    title: "GARDEN AFTER THE STORM", 
    duration: "5:23", 
    file: "track_01_garden_after_the_storm.wav",
    description: `Created in collaboration with the wonderfully talented, Arica Hilton (IG: @aricahilton), whose lovely poetry inspired the song – I feel extremely fortunate she allowed me to put her poetic vision to music – meant, not just to be heard, but also to be felt.

"Garden After the Storm" is a cinematic piano ballad about transformation after trauma. The song reflects on the choice between carrying the darkness we've experienced and allowing it to dissolve into something new. Moving from broken rooms and quiet fear toward healing and growth, the story follows the idea that scars can become gardens if we choose to nurture what comes after the storm. With intimate verses and a powerful emotional chorus, the song explores resilience, forgiveness, and the quiet strength of letting the past drift away.`
  },
  { 
    number: 2, 
    title: "I HEARD AN OAK TREE", 
    duration: "7:48", 
    file: "track_02_i_heard_an_oak_tree.wav",
    description: `"I Heard an Oak Tree" continues the story that began in "Garden After the Storm." In the first song, the artist releases the weight of past wounds and learns to let pain dissolve into something new. In this sequel, they return to that same garden (now quiet after the storm) and hear something deeper beneath the silence.

An ancient oak tree becomes the voice of the earth itself, reminding the listener that the elements shaping mountains, oceans, and forests are the same elements that form us. Through hypnotic repetition and atmospheric soundscapes, the song moves from personal healing to a broader realization: that we are not separate from the world around us. The storm may pass, but what remains is belonging.

The oak tree laments, "I was here before you, rooted, like you, reaching, like you."

These songs are meant to be experienced as a journey rather than isolated tracks. Garden After the Storm begins with emotional release: the quiet aftermath of turmoil and the first breath of healing. I Heard an Oak Tree moves into reflection, where the listener pauses in that stillness and begins to hear the deeper rhythms of the earth and of oneself.`
  },
  { 
    number: 3, 
    title: "SUNSTORM OF PASSION", 
    duration: "5:48", 
    file: "track_03_sunstorm_of_passion.wav",
    description: `"Sunstorm of Passion" is a sensual cinematic piano ballad about surrendering to a love that feels inevitable and cosmic. Set in a candlelit room filled with the scent of jasmine, the song unfolds like a storm slowly gathering in the sky: quiet longing building into overwhelming passion.

Through imagery of galaxies, moonlit whispers, and clouds heavy with rain, the singer describes the intoxicating pull of desire that leaves no room for resistance. What begins as a delicate atmosphere of fragrance and distant poetry gradually becomes a powerful emotional storm: one that consumes both body and soul.

As the music swells with orchestral intensity, the song captures the moment when control dissolves and two people give themselves fully to the gravity between them. In the end, the storm quiets into a whisper, leaving only breath, memory, and the lingering echo of passion in the air.`
  },
  { 
    number: 4, 
    title: "DEEPER THAN LOVE", 
    duration: "5:23", 
    file: "track_04_deeper_than_love.wav",
    description: `"Deeper Than Love" is a sensual, mystical Buddha Bar–style lounge track that explores the idea that some connections transcend time, memory, and even identity. Wrapped in a slow, hypnotic groove of deep bass, atmospheric pads, and delicate world instrumentation, the song unfolds like a whispered meditation on cosmic reunion.

Through imagery of roots stretching across oceans, ancient branches bearing fruit, and stardust scattering into hope, the lyrics suggest that two souls are not meeting for the first time, but rediscovering each other after lifetimes of wandering. The kiss at the center of the song becomes symbolic: less a moment of passion than a recognition of something eternal that has always existed beneath the surface.

The result is a lush, late-night lounge experience: atmospheric, sensual, and contemplative, evoking the feeling of two wanderers finally realizing they have arrived home in one another.

"You think you are meeting for the first time
But you realize you are the wanderer
who finally found home.

This is deeper than love, my love."`
  },
  { 
    number: 5, 
    title: "RIVERS IN ME", 
    duration: "5:50", 
    file: "track_05_rivers_in_me.wav",
    description: `The central theme of "Rivers in Me" is emotional connection that runs deeper than words. It explores the idea that when two people truly connect, the experience feels like an unseen current moving beneath the surface: quiet but powerful, like rivers flowing through the night.

The imagery of rivers, stars, silence, and night represents inner emotions that are difficult to explain but deeply felt. The song suggests that love or connection is not always loud or dramatic; sometimes it appears in quiet moments of shared understanding, reflection, and presence.

At its core, the theme is about surrendering to that emotional current: allowing yourself to feel something profound and transformative, even if it cannot be fully expressed in language. The repeated phrase about "rivers" becomes a metaphor for the flow of feeling, memory, and intimacy moving through both people at once.`
  },
  { 
    number: 6, 
    title: "THE MUSIC OF OUR BECOMING", 
    duration: "5:21", 
    file: "track_06_the_music_of_our_becoming.wav",
    description: `"The Music of Our Becoming" is written as a metaphorically complex poem vs. a structured song. This piece centers on reunion, rebirth, and the sacred intensity of rediscovered love. It portrays two lovers returning to one another not merely as continuation, but as transformation: shedding distance, restraint, and fear to become something deeper and newly awakened.

At its core, the theme is relief and renewal: love surviving exile and emerging not diminished, but purified and reborn through longing and return. Metaphors draw from René Magritte's "The Lovers," which symbolizes the frustration of desire.`
  }
];

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Welcome to Garden After the Storm! 🎵 I'm here to help you explore the album, learn about the artists Erich Fritz and Arica Hilton, or answer any questions. You can also share images or videos with me! How can I help you today?"
      }]);
    }
  }, [isOpen, messages.length]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const cancelFileSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setIsUploading(false);
      return response.data;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || isLoading) return;

    let fileData = null;
    
    // Upload file first if selected
    if (selectedFile) {
      try {
        fileData = await uploadFile(selectedFile);
      } catch (error) {
        console.error("Upload failed:", error);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Sorry, I couldn't upload your file. Please try again."
        }]);
        cancelFileSelection();
        return;
      }
    }

    const userMessage = {
      role: "user",
      content: inputText || (selectedFile ? `Shared a file: ${selectedFile.name}` : ""),
      file: fileData ? {
        url: fileData.url,
        type: fileData.file_type,
        name: fileData.file_name
      } : null
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    cancelFileSelection();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: userMessage.content,
        file_url: fileData?.url,
        file_type: fileData?.file_type,
        file_name: fileData?.file_name
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.response
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        data-testid="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-btn"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" data-testid="chat-window">
          <div className="chat-header">
            <span>Garden After the Storm Assistant</span>
            <button onClick={() => setIsOpen(false)} className="chat-close-btn" data-testid="chat-close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chat-messages" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.file && msg.file.type === "image" && (
                  <img src={`${BACKEND_URL}${msg.file.url}`} alt={msg.file.name} className="chat-file-preview" />
                )}
                {msg.file && msg.file.type === "video" && (
                  <video src={`${BACKEND_URL}${msg.file.url}`} controls className="chat-file-preview" />
                )}
                {msg.file && !["image", "video"].includes(msg.file.type) && (
                  <div className="chat-file-attachment">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>{msg.file.name}</span>
                  </div>
                )}
                <p>{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="file-preview-bar" data-testid="file-preview">
              <div className="file-preview-info">
                {selectedFile.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="file-thumbnail" />
                ) : selectedFile.type.startsWith("video/") ? (
                  <div className="file-thumbnail video-thumb">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                ) : (
                  <div className="file-thumbnail doc-thumb">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    </svg>
                  </div>
                )}
                <span className="file-name">{selectedFile.name}</span>
              </div>
              {isUploading ? (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{uploadProgress}%</span>
                </div>
              ) : (
                <button onClick={cancelFileSelection} className="cancel-file-btn" data-testid="cancel-file-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="chat-input-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.txt,.csv"
              style={{ display: "none" }}
              data-testid="file-input"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="attach-btn"
              disabled={isLoading || isUploading}
              data-testid="attach-file-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading || isUploading}
              data-testid="chat-input"
            />
            <button 
              onClick={sendMessage} 
              disabled={(!inputText.trim() && !selectedFile) || isLoading || isUploading}
              className="send-btn"
              data-testid="send-message-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Merch data
const MERCH_ITEMS = [
  {
    id: 1,
    category: "ALBUMS",
    title: "Limited Edition Album - Signed & Numbered",
    description: "A true collector's edition, limited to only 250 copies. This stunning gatefold album opens to reveal exclusive artwork and comes personally signed by Erich Fritz and Arica Hilton.",
    price: "$650.00",
    image: IMAGES.album
  },
  {
    id: 2,
    category: "ALBUMS",
    title: "Garden After the Storm - Standard Edition",
    description: "Garden After the Storm on high-quality vinyl. 10 tracks of poetry and music through a journey of transformation, love, passion and ultimately peace.",
    price: "$24.99",
    image: IMAGES.album
  },
  {
    id: 3,
    category: "BOOKS",
    title: "Garden After the Storm 2026 - Poetry Book",
    description: "Limited Edition signed by the artist. This beautiful 8\" x 10\" paperback features the complete poetry collection from the album with stunning artwork.",
    price: "$50.00",
    image: `${BACKEND_URL}/api/uploads/book_cover.png`
  }
];

// Main App Component
function App() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");
  const [activeTrack, setActiveTrack] = useState(null);
  const [merchFilter, setMerchFilter] = useState("all");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      await axios.post(`${API}/subscribe`, { email });
      setSubscribeStatus("success");
      setEmail("");
    } catch (error) {
      setSubscribeStatus("error");
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="app" data-testid="app-container">
      {/* Navigation */}
      <nav className="nav" data-testid="main-nav">
        <div className="nav-links">
          <button onClick={() => scrollToSection("music")} data-testid="nav-music">MUSIC</button>
          <button onClick={() => scrollToSection("about")} data-testid="nav-about">ABOUT</button>
          <button onClick={() => scrollToSection("merch")} data-testid="nav-merch">MERCH</button>
          <button onClick={() => scrollToSection("links")} data-testid="nav-links">LINKS</button>
          <button onClick={() => scrollToSection("subscribe")} data-testid="nav-subscribe">SUBSCRIBE</button>
        </div>
        <div className="social-links">
          <a href="https://spotify.com" target="_blank" rel="noopener noreferrer" data-testid="social-spotify">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" data-testid="social-youtube">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="https://soundcloud.com" target="_blank" rel="noopener noreferrer" data-testid="social-soundcloud">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.125c-.051 0-.094.046-.101.1l-.158 1.029.158.984c.007.055.05.095.101.095.05 0 .09-.04.099-.095l.178-.984-.193-1.029c-.009-.06-.052-.1-.084-.1zm1.8-1.501c-.06 0-.105.05-.113.109l-.22 2.255.22 2.154c.008.06.053.11.113.11.059 0 .104-.05.112-.11l.249-2.154-.249-2.255c-.008-.059-.053-.109-.112-.109zm.899-.226c-.069 0-.121.058-.128.125l-.193 2.481.193 2.363c.007.067.059.125.128.125.068 0 .12-.058.127-.125l.218-2.363-.218-2.481c-.007-.067-.059-.125-.127-.125zm.9-.3c-.078 0-.136.066-.143.14l-.165 2.781.165 2.497c.007.074.065.14.143.14.077 0 .135-.066.142-.14l.188-2.497-.188-2.781c-.007-.074-.065-.14-.142-.14zm.899-.3c-.087 0-.152.074-.158.156l-.138 3.081.138 2.631c.006.083.071.157.158.157.086 0 .151-.074.157-.157l.156-2.631-.156-3.081c-.006-.082-.071-.156-.157-.156zm.9-.226c-.096 0-.166.082-.172.171l-.11 3.307.11 2.765c.006.09.076.172.172.172.095 0 .165-.082.171-.172l.124-2.765-.124-3.307c-.006-.089-.076-.171-.171-.171zm.899-.15c-.104 0-.181.09-.187.189l-.082 3.457.082 2.898c.006.098.083.188.187.188.103 0 .18-.09.186-.188l.093-2.898-.093-3.457c-.006-.099-.083-.189-.186-.189zm.901-.076c-.114 0-.196.099-.201.205l-.055 3.533.055 3.031c.005.107.087.205.201.205.113 0 .195-.098.2-.205l.062-3.031-.062-3.533c-.005-.106-.087-.205-.2-.205zm.898.025c-.123 0-.212.107-.216.221l-.027 3.508.027 3.165c.004.114.093.221.216.221.122 0 .211-.107.215-.221l.031-3.165-.031-3.508c-.004-.114-.093-.221-.215-.221zm2.65-1.576c-.323 0-.636.047-.932.134-.19-2.149-2.012-3.831-4.236-3.831-.575 0-1.138.119-1.654.344-.193.084-.245.17-.247.336v8.173c.003.17.142.308.313.32 0 0 6.719.007 6.756.007 1.318 0 2.386-1.065 2.386-2.379 0-1.314-1.068-2.38-2.386-2.38v.276z"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" data-testid="social-instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" data-testid="social-tiktok">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" data-testid="social-twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" data-testid="social-facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" data-testid="hero-section">
        <video 
          className="hero-video" 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          poster={IMAGES.album}
          data-testid="hero-video"
          onCanPlay={(e) => e.target.play()}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper">
          <div className="hero-album-cover" data-testid="hero-album-cover">
            <img src={IMAGES.album} alt="Garden After the Storm Album - Erich Fritz and Arica Hilton" />
          </div>
          <div className="hero-text">
            <p className="release-date">Album Release</p>
            <p className="release-date-value">10 April 2026</p>
            <button className="stream-btn" onClick={() => scrollToSection("music")} data-testid="stream-now-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Stream Now
            </button>
          </div>
        </div>
      </section>

      {/* Music Section */}
      <section id="music" className="music-section" data-testid="music-section">
        <p className="section-label">Now Available</p>
        <h2>Stream the Album</h2>
        
        <div className="album-container">
          <div className="album-cover">
            <img src={IMAGES.album} alt="Garden After the Storm Album Cover" data-testid="album-cover" />
          </div>
          <div className="album-info">
            <span className="album-year">2026</span>
            <h3>Garden After the Storm</h3>
            <p className="track-count">6 Tracks</p>
            
            <div className="track-list" data-testid="track-list">
              {TRACKS.map((track) => (
                <div 
                  key={track.number} 
                  className={`track ${activeTrack === track.number ? 'active' : ''}`}
                  data-testid={`track-${track.number}`}
                >
                  <div className="track-header" onClick={() => setActiveTrack(activeTrack === track.number ? null : track.number)}>
                    <span className="track-number">{track.number}</span>
                    <span className="track-title">{track.title}</span>
                    <span className="track-duration">{track.duration}</span>
                  </div>
                  {activeTrack === track.number && (
                    <div className="track-expanded">
                      <div className="track-player">
                        <audio controls src={`${BACKEND_URL}/api/uploads/${track.file}`}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      {track.description && (
                        <div className="track-description">
                          {track.description.split('\n\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section" data-testid="about-section">
        <p className="section-label">The Artists</p>
        <h2>About</h2>
        
        <div className="artists-grid">
          <div className="artist-card" data-testid="artist-erich">
            <div className="artist-img-wrapper">
              <img src={IMAGES.erich} alt="Erich Fritz" className="erich-photo" />
            </div>
            <h3>Erich Fritz</h3>
            <p>Erich Fritz, known musically as @darko_vaughn, is a composer, poet, and multidisciplinary creator whose work blends atmospheric electronic music with lyrical storytelling. His sound transforms poetry into cinematic sonic landscapes—melding spoken word, ambient textures, and progressive electronic rhythms to create music that feels both intimate and expansive.</p>
            <p>Drawing inspiration from Renaissance thinkers such as Leonardo da Vinci, Fritz approaches creativity through an interdisciplinary lens, merging analytical precision with emotional depth. His work often explores themes of love, transformation, memory, and renewal, turning written verse into immersive musical experiences.</p>
            <p>His latest collaboration marks the first release from the album "Garden After the Storm," a project built around the idea of poetry reborn through music. The album is part of a broader creative partnership that will also include original music for the television series "For the Love of Art."</p>
            <p>Outside of music, Fritz is the Founder and CEO of Fritz & Company, a technology-focused advisory firm. Prior to founding the firm, he spent more than a decade in investment banking advising technology companies and began his career as an electrical engineer working on advanced missile defense software at Northrop Grumman. He holds an MBA from the University of Chicago Booth School of Business, completed graduate coursework in applied mathematics at Johns Hopkins University's Applied Physics Laboratory, and earned his Bachelor's degree in Electrical Engineering from Penn State.</p>
            <p>Whether composing music, writing poetry, or building companies, Fritz embodies a modern Renaissance ethos—bringing together engineering, finance, and artistic expression into a singular creative voice.</p>
            <p>Follow @darko_vaughn to experience the evolving journey of Garden After the Storm and future collaborations.</p>
          </div>
          
          <div className="artist-card" data-testid="artist-arica">
            <div className="artist-img-wrapper">
              <img src={IMAGES.arica} alt="Arica Hilton" />
            </div>
            <h3>Arica Hilton</h3>
            <p>Arica Hilton (pen name Sophia Jolie) is a multidisciplinary artist, poet and global advocate whose life mission is to use her creativity to bring awareness to humanitarian and environmental issues that effect our world.</p>
            <p>In March 2026, Hilton collaborated with composer and poet, Erich Fritz (stage name @darko_vaughn) to create an album titled GARDEN AFTER THE STORM. Fritz wrote the music to Hilton's poetry. The complete album will be released late spring 2026.</p>
            <p>In the summer of 2024, Hilton's book of poetry "Let Me Tell You About Winds" was published by Dar Attakween, with an introduction by the perennial Nobel Prize nominated poet, Adonis (Ali Ahmad Said Esber). Adonis writes, "Wherever and whenever the reader enters Arica Hilton's world, he sees what he did not expect and must murmur with joy: It is poetry – a luminous explosion in the darkness of life, and it seems to be a language to make death die."</p>
            <p>In 2020, Hilton was invited to be the inaugural, lead artist-in-residence for Immersive Van Gogh Chicago where she created a body of work inspired by Vincent Van Gogh with an eco-conscious, contemporary twist.</p>
            <p>In 2019, she was honored as Greenheart International's Global Leader Honoree for her work as artist, curator and youth empowerment champion. Greenheart International is a global nonprofit that educates children to become global leaders. Previous Honorees include Nobel Peace Prize co-recipient Jerry White for his work on banning land mines and Hungarian scientist, philosopher and Nobel Prize nominee Dr. Ervin Laszlo.</p>
            <p>In 2018, Hilton traveled to the Indonesian archipelago of Raja Ampat in the Pacific Ocean as the artist on board to participate in the Elysium – Artists for the Coral Triangle Expedition. Sponsored by Ocean Geographic magazine, the expedition engaged artists, photographers scientists, musicians and writers to document threats to the extraordinary biodiversity of the Coral Triangle. Protection of the area from unsustainable fishing practices, over-exploitation and climate change is a global priority. She participated in the Elysium Epic exhibition in China with Time Magazine's Hero for the Planet, Dr. Sylvia Earle, along with the Ocean Geographic team of scientists, marine biologists, filmmakers and writers.</p>
            <p>In 2021, Hilton's art and poetry exhibit at BRUSHWOOD CENTER at RYERSON WOODS, "TIDES, A Prelude" emphasized NATURE as the driving force of the exhibition based on the gravitational pull of the sun and moon on the earth's bodies of waters. Exploring the spectrum of color, shape and frequency of sound, Hilton's paintings and poetry delved into the meaning of the TIDES in a direct and indirect menu of materials, both real and metaphorical.</p>
            <p>The former President of the Poetry Center of Chicago, Hilton created ARTS POETICA GLOBAL, whose mission is to include all creative endeavors, from the visual to the literary arts; dance, film, photography, music, architecture. Arts Poetica is a platform for global initiatives and philosophies that are presented in an imaginative and powerful way by contemporary thought leaders.</p>
            <p>Hilton has had numerous exhibitions in Europe, Asia and the United States. Her series, "I Flow Like Water," a body of works that highlight issues around water conservation and the problem of plastics weighing down our oceans, was exhibited at Art Dubai, Beirut Art Fair; QU ART in Brussels, Belgium; the Union League Club of Chicago; the Caux Forum for Just Governance and Human Security in Caux, Switzerland and in Beijing, Shanghai, Chengdu, China.</p>
            <p>Hilton is based in Chicago, where she is the Founder and CEO of Hilton Contemporary, a gallery platform she leverages to support internationally known artists and humanitarians who seek change for a better world.</p>
            <p><a href="https://www.aricahilton.com" target="_blank" rel="noopener noreferrer">www.aricahilton.com</a></p>
            <p>Instagram: <a href="https://www.instagram.com/aricahilton/" target="_blank" rel="noopener noreferrer">@aricahilton</a></p>
          </div>
        </div>

        <div className="story-section" data-testid="album-story">
          <h3>The Story Behind the Album</h3>
          <p>Erich Fritz and Arica Hilton met through their mutual love of art. Fritz is an art collector and Hilton is an artist and gallerist. The image on the cover of the album, Van Gogh's "Wheat fields with Cypresses" is especially meaningful because it was the work that brought them together. Fritz had purchased the Van Gogh "Wheatfields...." by artist Jeff Koons from his infamous Gazing Ball series long before they met. And ironically, Hilton was the inaugural artist-in-residence for Van Gogh Immersive in Chicago.</p>
          <p>One day Hilton sent Fritz her poem "Unlike You" (which is now transformed to Garden After the Storm) and he nonchalantly asked if he could put the poem to music. That was the beginning of their collaboration on a poetry/music album that resulted in an exercise in sleepless nights and their extreme dedication to perfection in all things they do.</p>
          <p>Contemporary polymaths, both artists also happen to be CEO's of their own companies, both are entrepreneurs and poets. Fritz studied electrical engineering and became a missile scientist studying applied mathematics and finance, AND went on to write music. Hilton studied architecture and is not only a poet, but an artist, designer, explorer and has worked with Nobel Prize winning authors and scientists.</p>
          <p>The Garden After the Storm album is their first collaboration.</p>
        </div>
      </section>

      {/* Merch Section */}
      <section id="merch" className="merch-section" data-testid="merch-section">
        <div className="merch-filters">
          <button 
            className={`merch-filter-btn ${merchFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMerchFilter('all')}
            data-testid="merch-filter-all"
          >All</button>
          <button 
            className={`merch-filter-btn ${merchFilter === 'ALBUMS' ? 'active' : ''}`}
            onClick={() => setMerchFilter('ALBUMS')}
            data-testid="merch-filter-albums"
          >Albums</button>
          <button 
            className={`merch-filter-btn ${merchFilter === 'BOOKS' ? 'active' : ''}`}
            onClick={() => setMerchFilter('BOOKS')}
            data-testid="merch-filter-books"
          >Books</button>
        </div>
        
        <div className="merch-grid">
          {MERCH_ITEMS.filter(item => merchFilter === 'all' || item.category === merchFilter).map((item) => (
            <div className="merch-item" key={item.id} data-testid={`merch-item-${item.id}`}>
              <div className="merch-image-container">
                <span className={`merch-category-badge ${item.category.toLowerCase()}`}>{item.category}</span>
                <img src={item.image} alt={item.title} className="merch-image" />
              </div>
              <h3>{item.title}</h3>
              <p className="merch-description">{item.description}</p>
              <div className="merch-footer">
                <p className="merch-price">{item.price}</p>
                <button className="merch-btn" data-testid={`buy-btn-${item.id}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Links Section */}
      <section id="links" className="links-section" data-testid="links-section">
        <p className="section-label">Explore More</p>
        <h2>Links</h2>
        <p className="links-subtitle">Discover more about the artists and their work</p>
        
        <div className="website-links">
          <a href="https://aricahilton.com/" target="_blank" rel="noopener noreferrer" className="website-link-card" data-testid="link-arica">
            <div className="website-link-content">
              <h3>Arica Hilton</h3>
              <p>Official website of Arica Hilton - multidisciplinary artist, poet and global advocate</p>
              <span className="website-url">https://aricahilton.com/</span>
            </div>
            <svg className="external-link-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          
          <a href="https://artspoetica.com/" target="_blank" rel="noopener noreferrer" className="website-link-card" data-testid="link-artspoetica">
            <div className="website-link-content">
              <h3>Arts Poetica Global</h3>
              <p>A platform for global initiatives and philosophies presented by contemporary thought leaders</p>
              <span className="website-url">https://artspoetica.com/</span>
            </div>
            <svg className="external-link-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </section>

      {/* Subscribe Section */}
      <section id="subscribe" className="subscribe-section" data-testid="subscribe-section">
        <p className="section-label">Exclusive Access</p>
        <h2>GET BONUS TRACKS</h2>
        <p className="subscribe-description">Subscribe now and receive 2 exclusive bonus tracks from "Garden After the Storm" plus behind-the-scenes content.</p>
        
        <form onSubmit={handleSubscribe} className="subscribe-form" data-testid="subscribe-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            data-testid="subscribe-email-input"
          />
          <button type="submit" data-testid="subscribe-submit-btn">Subscribe</button>
        </form>
        
        {subscribeStatus === "success" && (
          <p className="subscribe-success" data-testid="subscribe-success">Thank you for subscribing!</p>
        )}
        {subscribeStatus === "error" && (
          <p className="subscribe-error" data-testid="subscribe-error">Something went wrong. Please try again.</p>
        )}
        
        <p className="privacy-note">We respect your privacy. Unsubscribe anytime.</p>
      </section>

      {/* Footer */}
      <footer className="footer" data-testid="footer">
      </footer>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

export default App;
