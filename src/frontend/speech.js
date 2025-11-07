// speech.js
export function startSpeechRecognition(onResult, onEnd = null, onError = null) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
    if (!SpeechRecognition) {
      console.error("SpeechRecognition is not supported in this browser.");
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN'; // Vietnamese language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
  
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log('Voice detected:', transcript);
      if (onResult) onResult(transcript);
    };
  
    recognition.onerror = (event) => {
      console.error(' Speech recognition error:', event.error);
      if (onError) onError(event.error);
    };
  
    recognition.onend = () => {
      console.log(' Speech recognition ended.');
      if (onEnd) onEnd();
    };
  
    console.log(' Listening for Vietnamese speech...');
    recognition.start();
  }
  