const textInput = document.getElementById('inputText');
const levelSelect = document.getElementById('level');
const submitBtn = document.getElementById('submitBtn');
const voiceBtn = document.getElementById('voiceBtn');
const emojiBtn = document.getElementById('emojiBtn');
const statusEl = document.getElementById('status');
const chatWindow = document.getElementById('chatWindow');
const typingIndicator = document.getElementById('typingIndicator');
const emojiPicker = document.getElementById('emojiPicker');

let recognition = null;

// --- Voice Recognition ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onstart = ()=>{voiceBtn.classList.add('listening'); showStatus('Listening...');};
  recognition.onresult = (e)=>{textInput.value=e.results[0][0].transcript;};
  recognition.onend = ()=>{voiceBtn.classList.remove('listening'); showStatus('Ready to send!');};
  recognition.onerror = (e)=>{showStatus(`Error: ${e.error}`,true); voiceBtn.classList.remove('listening');};
  voiceBtn.addEventListener('click', ()=>{
    if(voiceBtn.classList.contains('listening')) recognition.stop();
    else { textInput.value=''; recognition.start(); }
  });
} else voiceBtn.style.display='none';

// --- Emoji Picker ---
emojiBtn.addEventListener('click', ()=>{emojiPicker.style.display = emojiPicker.style.display==='flex'?'none':'flex';});
emojiPicker.querySelectorAll('.emoji').forEach(e=>{
  e.addEventListener('click', ()=>{
    textInput.value += e.textContent;
    emojiPicker.style.display='none';
    textInput.focus();
  });
});

// --- Helpers ---
function showStatus(msg,isError=false){statusEl.textContent=msg; statusEl.style.color=isError?'#d92d20':'#4f46e5';}
function speak(text){const s = new SpeechSynthesisUtterance(text); s.lang='en-US'; window.speechSynthesis.speak(s);}
function addBubble(text,isUser){
  const div=document.createElement('div');
  div.className='chat-bubble '+(isUser?'user-bubble':'ai-bubble');
  div.innerHTML=text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop=chatWindow.scrollHeight;
}

// --- API Call ---
async function analyzeSentence(sentence, level){
  typingIndicator.style.display='block';
  const resp=await fetch('/api/english-assist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:sentence,level})});
  typingIndicator.style.display='none';
  if(!resp.ok){ const e=await resp.json(); throw new Error(e?.error||'Server error'); }
  return resp.json();
}

// --- Send Button ---
submitBtn.addEventListener('click', async ()=>{
  const sentence=textInput.value.trim(); const level=levelSelect.value;
  if(!sentence){ showStatus('Type something...',true); return; }

  addBubble(sentence,true); textInput.value=''; showStatus('Analyzing...');

  try{
    const response=await analyzeSentence(sentence,level);
    const fields=[
      {title:'Corrected Sentence',value:response.corrected},
      {title:'Paraphrase',value:response.paraphrase},
      {title:'Explanation',value:response.explanation},
      {title:'In-App Suggestion',value:response.suggestion},
      {title:'Next Practice Prompt',value:response.nextPractice}
    ];
    fields.forEach(f=>addBubble(`${f.title}: ${f.value}`,false));
    speak(response.corrected);
    showStatus('Success!');
  }catch(err){showStatus(err.message||'Failed',true);}
});