import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './App.css'; // Your original CSS file

// Medical Knowledge Base (No changes)
const medicalKnowledge = {
  headache: {
    tablets: ["Paracetamol 500mg", "Ibuprofen 400mg"],
    suggestions: [
      "Rest in a quiet, dark room",
      "Stay hydrated - drink plenty of water",
      "Apply a cold compress to your forehead",
      "Avoid screens and bright lights",
      "If severe or persistent, consult a doctor"
    ]
  },
  fever: {
    tablets: ["Paracetamol 650mg", "Ibuprofen 400mg"],
    suggestions: [
      "Rest and get plenty of sleep",
      "Drink lots of fluids (water, juice, soup)",
      "Take a lukewarm bath",
      "Wear light clothing",
      "Monitor temperature regularly",
      "See a doctor if fever persists beyond 3 days"
    ]
  },
  cold: {
    tablets: ["Cetirizine 10mg", "Paracetamol 500mg", "Vitamin C"],
    suggestions: [
      "Rest and sleep adequately",
      "Drink warm fluids like tea, soup",
      "Gargle with warm salt water",
      "Use steam inhalation",
      "Eat nutritious food",
      "Consult doctor if symptoms worsen"
    ]
  },
  cough: {
    tablets: ["Cough syrup (Dextromethorphan)", "Honey (natural remedy)"],
    suggestions: [
      "Stay hydrated with warm liquids",
      "Use honey and lemon in warm water",
      "Avoid cold drinks and ice cream",
      "Use a humidifier in your room",
      "Avoid smoking and polluted areas",
      "See a doctor if cough persists beyond 2 weeks"
    ]
  },
  "stomach ache": {
    tablets: ["Antacid (Eno/Digene)", "Omeprazole 20mg"],
    suggestions: [
      "Eat light, bland foods (rice, banana, toast)",
      "Avoid spicy and oily foods",
      "Drink plenty of water",
      "Apply a warm compress to stomach",
      "Avoid lying down immediately after eating",
      "Consult doctor if pain is severe or persistent"
    ]
  },
  acidity: {
    tablets: ["Omeprazole 20mg", "Pantoprazole 40mg", "Antacid"],
    suggestions: [
      "Avoid spicy and oily foods",
      "Eat smaller, frequent meals",
      "Don't lie down right after eating",
      "Avoid tea, coffee, alcohol",
      "Drink cold milk",
      "Elevate your head while sleeping"
    ]
  }
};

// --- MODIFIED processMessage ---
// It now has a "fallback" type if it doesn't understand
const processMessage = (message, waitingForConfirmation) => {
  const msg = message.toLowerCase().trim();
  
  if (waitingForConfirmation) {
    if (msg.includes('yes') || msg.includes('sure') || msg.includes('ok') || msg.includes('please')) {
      return {
        type: 'deliver',
        response: "Great! I'm dispatching the robotic arm to deliver your medicine. Please wait... 🦾💊",
        needsConfirmation: false
      };
    } else if (msg.includes('no') || msg.includes('not')) {
      return {
        type: 'text',
        response: "No problem! Let me know if you need anything else. Take care! 😊",
        needsConfirmation: false
      };
    }
  }
  
  if (msg.match(/^(hi|hello|hey|good morning|good evening)/)) {
    return {
      type: 'text',
      response: "Hello! 👋 I'm your medical assistant with robotic delivery system.\n\nI can help you with:\n• Medical queries (headache, fever, cold, etc.)\n• Medicine delivery via robotic arm\n\nWhat symptoms are you experiencing today?",
      needsConfirmation: false
    };
  }
  
  for (const [condition, data] of Object.entries(medicalKnowledge)) {
    if (msg.includes(condition)) {
      let response = `Medical Advice for ${condition.toUpperCase()}:\n\n`;
      response += `💊 Recommended Tablets:\n`;
      data.tablets.forEach(tablet => response += `• ${tablet}\n`);
      response += `\n📋 Suggestions:\n`;
      data.suggestions.forEach(suggestion => response += `• ${suggestion}\n`);
      response += `\n⚠️ Disclaimer: This is general advice. Please consult a healthcare professional.\n\n`;
      response += `Would you like me to deliver the medicine via the robotic arm? (Yes/No)`;
      
      return { 
        type: 'medical', 
        response,
        needsConfirmation: true
      };
    }
  }
  
  // --- THIS IS THE NEW PART ---
  // If no other rules matched, return a 'fallback' type.
  // This tells the main app to call the AI.
  return {
    type: 'fallback',
    response: "That's a good question. Let me think...",
    needsConfirmation: false
  };
};

// --- MODIFIED RoboticArm3D ---
// This is the responsive version from the previous step,
// which correctly sizes the canvas.
const RoboticArm3D = ({ isDelivering, onDeliveryComplete }) => {
  const mountRef = useRef(null);
  const armRef = useRef({ 
    segment1: null, 
    segment2: null, 
    segment3: null,
    medicine: null
  });
  const animationRef = useRef(null);
  const sceneRef = useRef(null); // To store scene for cleanup

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Get dimensions from container
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene; // Store scene
    
    // Make camera and renderer responsive
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(25, 20, 25);
    camera.lookAt(0, 5, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement); // Append canvas to container

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const floorGeom = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(50, 20, 0x4a5568, 0x2d3748);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const standGroup = new THREE.Group();
    const standMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const standShelf = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 3), standMat);
    standShelf.position.y = 6;
    standShelf.castShadow = true;
    standGroup.add(standShelf);
    standGroup.position.set(-10, 0, 0);
    scene.add(standGroup);

    const medicineGroup = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    box.castShadow = true;
    medicineGroup.add(box);
    
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    crossH.position.z = 0.51;
    medicineGroup.add(crossH);
    
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.2, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    crossV.position.z = 0.51;
    medicineGroup.add(crossV);
    
    medicineGroup.position.set(-10, 7, 0);
    scene.add(medicineGroup);

    const personGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x34495e })
    );
    body.position.y = 2.5;
    body.castShadow = true;
    personGroup.add(body);
    
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffdbac })
    );
    head.position.y = 5.7;
    head.castShadow = true;
    personGroup.add(head);
    
    personGroup.position.set(12, 0.5, 0);
    scene.add(personGroup);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3, 2, 32),
      new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
    );
    base.position.y = 1;
    base.castShadow = true;
    scene.add(base);

    const segment1 = new THREE.Group();
    const arm1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6b35 })
    );
    arm1.position.y = 4;
    arm1.castShadow = true;
    segment1.add(arm1);
    segment1.position.y = 2;
    scene.add(segment1);

    const segment2 = new THREE.Group();
    const arm2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6b35 })
    );
    arm2.position.y = 4;
    arm2.castShadow = true;
    segment2.add(arm2);
    segment2.position.y = 8;
    segment1.add(segment2);

    const segment3 = new THREE.Group();
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x95a5a6 })
    );
    hand.position.y = 1;
    hand.castShadow = true;
    segment3.add(hand);
    segment3.position.y = 8;
    segment2.add(segment3);

    armRef.current = { segment1, segment2, segment3, medicine: medicineGroup };

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!isDelivering || !armRef.current.segment1) return;

    const arm = armRef.current;
    const medicine = arm.medicine;

    const animateRotation = (object, axis, start, end, duration) => {
      return new Promise(resolve => {
        const startTime = Date.now();
        const startValue = object.rotation[axis];
        
        const update = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          
          object.rotation[axis] = startValue + (end - startValue) * eased;
          
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            resolve();
          }
        };
        update();
      });
    };

    const animate = async () => {
      await animateRotation(arm.segment1, 'y', 0, -Math.PI / 1.8, 1000);
      await animateRotation(arm.segment2, 'z', 0, Math.PI / 3.5, 1000);
      await animateRotation(arm.segment3, 'z', 0, Math.PI / 6, 800);

      await new Promise(resolve => setTimeout(resolve, 300));
      medicine.position.set(0, 1.5, 0);
      arm.segment3.add(medicine);

      await animateRotation(arm.segment3, 'z', Math.PI / 6, 0, 800);
      await animateRotation(arm.segment2, 'z', Math.PI / 3.5, 0, 1000);
      await animateRotation(arm.segment1, 'y', -Math.PI / 1.8, Math.PI / 1.8, 1500);
      await animateRotation(arm.segment2, 'z', 0, Math.PI / 3.5, 1000);
      await animateRotation(arm.segment3, 'z', 0, Math.PI / 6, 800);

      await new Promise(resolve => setTimeout(resolve, 500));
      if (sceneRef.current) {
        arm.segment3.remove(medicine);
        medicine.position.set(12, 7, 0);
        sceneRef.current.add(medicine);
      }

      await animateRotation(arm.segment3, 'z', Math.PI / 6, 0, 800);
      await animateRotation(arm.segment2, 'z', Math.PI / 3.5, 0, 1000);
      await animateRotation(arm.segment1, 'y', Math.PI / 1.8, 0, 1200);

      onDeliveryComplete();
    };

    animate();
  }, [isDelivering, onDeliveryComplete]);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
  );
};

// --- MODIFIED App Component ---
export default function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "👋 Hello! I'm your medical assistant!\n\nTell me your symptoms and I'll help you! 💊" }
  ]);
  const [input, setInput] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const chatEndRef = useRef(null);

  // --- THIS IS THE NEW handleSend FUNCTION ---
  const handleSend = async () => { // Now 'async'
    if (!input.trim() || isDelivering) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const localResponse = processMessage(input, waitingForConfirmation);
    setInput(''); // Clear input after processing

    if (localResponse.type === 'fallback') {
      // It's a general question! Send it to the backend.
      setWaitingForConfirmation(false);
      
      // Add a "Thinking..." message
      const thinkingMessage = { role: 'bot', content: localResponse.response };
      setMessages(prev => [...prev, thinkingMessage]);

      try {
        const serverResponse = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: input }),
          timeout: 10000
        });

        if (!serverResponse.ok) {
          throw new Error(`Server error: ${serverResponse.status}`);
        }

        const data = await serverResponse.json();

        if (data.response) {
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'bot', content: data.response };
            return newMessages;
          });
        } else {
          throw new Error("No response from server");
        }

      } catch (error) {
        console.error("Error fetching from server:", error);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'bot',
            content: "⚠️ Backend server is not running. Please start the backend with 'npm run server' in a separate terminal."
          };
          return newMessages;
        });
      }

    } else {
      // It's a medical or standard command. Handle it locally.
      if (localResponse.type === 'deliver') {
        setIsDelivering(true);
        setWaitingForConfirmation(false);
      } else if (localResponse.type === 'medical') {
        setWaitingForConfirmation(true);
      } else {
        setWaitingForConfirmation(false);
      }
      
      // Add the local response to messages
      setMessages(prev => [...prev, { role: 'bot', content: localResponse.response }]);
    }
  };

  const handleDeliveryComplete = () => {
    setIsDelivering(false);
    setMessages(prev => [...prev, { 
      role: 'bot', 
      content: "✅ Medicine delivered successfully! 💊\n\nThank you for using our service! Take care! 😊" 
    }]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="app-container">
      <div className="left-section">
        <h2 className="title">🦾 Robotic Medicine Delivery</h2>
        {isDelivering && (
          <div className="status-badge">🚀 Delivering Medicine...</div>
        )}
        <div className="robot-container">
          <RoboticArm3D isDelivering={isDelivering} onDeliveryComplete={handleDeliveryComplete}/>
        </div>
      </div>

      <div className="right-section">
        <div className="chat-header">
          <h1>💬 Medical Assistant</h1>
          <p>AI-powered health consultation</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-bubble">
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={waitingForConfirmation ? "Type 'yes' or 'no'..." : "Type your symptoms..."}
            className="chat-input"
            disabled={isDelivering}
          />
          <button
            onClick={handleSend}
            disabled={isDelivering}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}