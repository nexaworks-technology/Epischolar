"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, CardBody, Divider } from "@heroui/react";
import { ChevronRight, ChevronLeft, GraduationCap, Briefcase, Award, Building2, CheckCircle2, MessageSquare, Send, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type FormData = {
  university: { targetUniversity: string; program: string; qualities: string; longTermGoal: string; };
  personalBackground: { story: string; challenge: string; perspective: string; };
  extraCurricular: { organizations: string; hobbies: string; awards: string; };
};

const initialData: FormData = {
  university: { targetUniversity: "", program: "", qualities: "", longTermGoal: "" },
  personalBackground: { story: "", challenge: "", perspective: "" },
  extraCurricular: { organizations: "", hobbies: "", awards: "" }
};

const STEPS = [
  { id: "university", title: "University", icon: Building2, subtitle: "Dream School" },
  { id: "background", title: "Background", icon: GraduationCap, subtitle: "Core Identity" },
  { id: "extracurricular", title: "Activities", icon: Award, subtitle: "Clubs & Hobbies" },
  { id: "chatbot", title: "Discovery AI", icon: MessageSquare, subtitle: "Interview" },
];

const FormInput = ({ label, isRequired, className, ...props }: any) => (
  <div className={`flex flex-col space-y-2 w-full ${className || ''}`}>
    <label className="text-sm font-semibold text-gray-700">
      {label} {isRequired && <span className="text-brand-primary ml-0.5">*</span>}
    </label>
    <input 
      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-bot focus:border-brand-primary transition-all shadow-sm leading-relaxed"
      required={isRequired}
      {...props} 
    />
  </div>
);

const FormTextarea = ({ label, isRequired, minRows = 3, className, ...props }: any) => (
  <div className={`flex flex-col space-y-2 w-full ${className || ''}`}>
    <label className="text-sm font-semibold text-gray-700">
      {label} {isRequired && <span className="text-brand-primary ml-0.5">*</span>}
    </label>
    <textarea 
      rows={minRows}
      required={isRequired}
      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-bot focus:border-brand-primary transition-all shadow-sm resize-y leading-relaxed"
      {...props} 
    />
  </div>
);

export function WizardForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [chatMessages, setChatMessages] = useState<{role: 'model' | 'user', parts: {text: string}[]}[]>([
    { role: 'model', parts: [{ text: 'Hi! I am the Discovery AI. I have reviewed your background information. To start, what would you say is your most unique trait or experience that you want to highlight in your Ivy League Application Essay?' }] }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [generatedSOP, setGeneratedSOP] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      if (!generatedSOP) return;
      
      const pdf = new jsPDF("p", "mm", "a4");
      const margin = 20;
      let y = 20;
      
      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      const title = `Statement of Purpose: ${formData.university.program || "Program"} (${formData.university.targetUniversity || "University"})`;
      const titleLines = pdf.splitTextToSize(title, 170);
      pdf.text(titleLines, margin, y);
      y += titleLines.length * 8 + 10;
      
      const addSection = (title: string, content: string) => {
        // Check if we need a new page for the title
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(title, margin, y);
        y += 8;
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(content || "", 170);
        
        // Add text line by line to handle page breaks
        for (let i = 0; i < lines.length; i++) {
          if (y > 275) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(lines[i], margin, y);
          y += 6; // line height
        }
        
        y += 8; // spacing after section
      };

      addSection("1. Introduction (Hook & Motivation)", generatedSOP.introduction);
      addSection("2. Academic Foundation (The Spike)", generatedSOP.academic);
      addSection("3. Professional & Experiential Proof", generatedSOP.professional);
      addSection("4. Why This University & Future Goals", generatedSOP.futureGoals);

      pdf.save(`${formData.university.targetUniversity || "University"}_Essay_Draft.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Error generating PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateSOP = async () => {
    setCurrentStep(4); // Only 5 steps total now (0, 1, 2, 3, 4)
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          chatMessages,
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      setGeneratedSOP(data);
    } catch (error) {
       console.error(error);
       alert("An error occurred while generating your Essay. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    // 1. Instantly show user message
    const newMessages = [...chatMessages, { role: 'user' as const, parts: [{ text: chatInput }] }];
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // 2. Send entire conversation history + user profile to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userProfile: formData
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      // 3. Append Gemini's response to the chat
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: data.message }] }]);
    } catch (error) {
       console.error(error);
       setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: "I'm sorry, I'm having trouble connecting to the server. Please check your API key." }] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const updateFields = (section: keyof FormData, fields: Partial<FormData[keyof FormData]>) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], ...fields } }));
  };

  const handleNextStepClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const form = document.getElementById('wizard-form') as HTMLFormElement;
    if (form && form.checkValidity()) {
      e.preventDefault();
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else if (form) {
      // Form is invalid, trigger native browser validation bubbles
      form.reportValidity();
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const renderStep = () => {
    const slideVariants: any = {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
      exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
    };

    switch (currentStep) {
      case 0:
        return (
          <motion.div variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dream University</h2>
              <p className="text-gray-500 mt-2 text-lg">Where are we applying? Let's dial in on the program and institution.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput label="Target College/University" isRequired placeholder="e.g. Stanford University" value={formData.university.targetUniversity} onChange={(e: any) => updateFields("university", { targetUniversity: e.target.value })} />
              <FormInput label="Target Program" isRequired placeholder="e.g. MS in Computer Science" value={formData.university.program} onChange={(e: any) => updateFields("university", { program: e.target.value })} />
              <FormTextarea label="What qualities of this university appeal to you?" className="md:col-span-2" placeholder="e.g. Research facilities, specific faculty..." value={formData.university.qualities} onChange={(e: any) => updateFields("university", { qualities: e.target.value })} />
              <FormTextarea label="Long Term Career Goals" className="md:col-span-2" placeholder="How does this program fit your 10-year plan?" value={formData.university.longTermGoal} onChange={(e: any) => updateFields("university", { longTermGoal: e.target.value })} />
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Personal Background</h2>
              <p className="text-gray-500 mt-2 text-lg">Help us understand the core narrative of your application essay.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormTextarea label="Core Identity / Defining Story" isRequired className="md:col-span-2" placeholder="What is the one story or trait that defines you?" value={formData.personalBackground.story} onChange={(e: any) => updateFields("personalBackground", { story: e.target.value })} />
              <FormTextarea label="Major Challenge Overcome" isRequired className="md:col-span-2" placeholder="Describe a time you faced adversity and how it changed you." value={formData.personalBackground.challenge} onChange={(e: any) => updateFields("personalBackground", { challenge: e.target.value })} />
              <FormTextarea label="Unique Perspective" className="md:col-span-2" placeholder="How do you view the world differently than others?" value={formData.personalBackground.perspective} onChange={(e: any) => updateFields("personalBackground", { perspective: e.target.value })} />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
            <div className="border-b border-gray-100 pb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Extra-Curricular</h2>
              <p className="text-gray-500 mt-2 text-lg">
                Your activities, community service, and hobbies paint a vibrant picture of you.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <FormTextarea label="Organizations and Clubs" placeholder="e.g. AI Society, Debate Club" value={formData.extraCurricular.organizations} onChange={(e: any) => updateFields("extraCurricular", { organizations: e.target.value })} />
              <FormTextarea label="Extracurricular Awards / Achievements" placeholder="e.g. Hackathon Winner, Best Volunteer" value={formData.extraCurricular.awards} onChange={(e: any) => updateFields("extraCurricular", { awards: e.target.value })} />
              <FormTextarea label="Hobbies & Interests" placeholder="e.g. Photography, Hiking" value={formData.extraCurricular.hobbies} onChange={(e: any) => updateFields("extraCurricular", { hobbies: e.target.value })} />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6 flex flex-col h-full">
            <div className="border-b border-gray-100 pb-4 flex-shrink-0">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Discovery AI Interview</h2>
              <p className="text-gray-500 mt-2 text-lg">Chat with our AI to uncover unique narrative "spikes" from your background.</p>
            </div>
            
            <div className="flex-1 bg-gray-50/50 border border-gray-200 rounded-3xl flex flex-col overflow-hidden h-[400px]">
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand-primary text-white rounded-tr-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      <p className="leading-relaxed text-[15px]">{msg.parts[0].text}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm bg-white border border-gray-100 text-gray-800 rounded-tl-sm flex items-center space-x-2">
                       <span className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce"></span>
                       <span className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce [animation-delay:0.2s]"></span>
                       <span className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your answer here..."
                    disabled={isChatLoading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-5 pr-14 py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white transition-all shadow-sm disabled:opacity-50"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isChatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100 pb-4">
               <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center text-green-600 shadow-sm flex-shrink-0">
                  <CheckCircle2 size={28} />
               </div>
               <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isGenerating ? "Drafting your Essay..." : "Your First Draft is Ready!"}
                  </h2>
                  <p className="text-gray-500 mt-1">
                     {isGenerating ? "Please wait while our AI synthesizes your profile and interview into a cohesive narrative." : "Structured using the \"Golden Thread\" framework based on your profile."}
                  </p>
               </div>
             </div>
             
             {isGenerating ? (
               <div className="flex-1 flex flex-col items-center justify-center space-y-6 h-[400px]">
                 <div className="relative w-20 h-20">
                    <div className="absolute inset-0 bg-brand-primary/20 rounded-full animate-ping"></div>
                    <div className="relative bg-white w-20 h-20 rounded-full shadow-lg border-2 border-brand-primary flex items-center justify-center text-brand-primary">
                      <MessageSquare size={32} className="animate-pulse" />
                    </div>
                 </div>
                 <p className="text-gray-600 font-medium animate-pulse">Analyzing transcript & weaving the Golden Thread...</p>
               </div>
             ) : generatedSOP ? (
               <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
                 {/* Left Column: SOP Editor View */}
                 <div id="sop-document" className="flex-1 bg-white rounded-2xl p-6 md:p-8 border border-gray-200 overflow-y-auto text-gray-800 text-[15px] leading-relaxed space-y-6 shadow-inner relative lg:w-2/3">
                   <div className="sticky top-0 bg-white/90 backdrop-blur-sm pb-3 border-b border-gray-100 mb-5 z-10">
                     <h3 className="text-xl font-bold text-gray-900">Application Essay: {formData.university.program || "Program"} ({formData.university.targetUniversity || "University"})</h3>
                   </div>
                   
                   <div className="group">
                      <h4 className="font-semibold text-brand-primary mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-bot text-brand-primary flex items-center justify-center text-xs">1</span>
                        Introduction (Hook & Motivation)
                      </h4>
                      <p className="pl-8 text-gray-600 group-hover:text-gray-900 transition-colors">
                        {generatedSOP.introduction}
                      </p>
                   </div>

                   <div className="group">
                      <h4 className="font-semibold text-brand-primary mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-bot text-brand-primary flex items-center justify-center text-xs">2</span>
                        Academic & Challenge (The Spike)
                      </h4>
                      <p className="pl-8 text-gray-600 group-hover:text-gray-900 transition-colors">
                        {generatedSOP.academic}
                      </p>
                   </div>

                   <div className="group">
                      <h4 className="font-semibold text-brand-primary mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-bot text-brand-primary flex items-center justify-center text-xs">3</span>
                        Professional & Experiential Proof
                      </h4>
                      <p className="pl-8 text-gray-600 group-hover:text-gray-900 transition-colors">
                        {generatedSOP.professional}
                      </p>
                   </div>
                   
                   <div className="group">
                     <h4 className="font-semibold text-brand-primary mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-bot text-brand-primary flex items-center justify-center text-xs">4</span>
                        Why This University & Future Goals
                     </h4>
                     <p className="pl-8 text-gray-600 group-hover:text-gray-900 transition-colors">
                       {generatedSOP.futureGoals}
                     </p>
                   </div>
                 </div>

                 {/* Right Column: Consultant Sidebar */}
                 <div className="w-full lg:w-1/3 bg-gray-50 rounded-2xl p-6 border border-gray-200 overflow-y-auto shadow-inner space-y-4">
                   <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-4 sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                     <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
                       <Award size={20} />
                     </div>
                     <h3 className="font-bold text-gray-900">Ivy Analysis</h3>
                   </div>
                   
                   <p className="text-sm text-gray-500 mb-4">
                     Our AI analyzed your essay against Tanabe's success principles from <i>50 Successful Ivy League Application Essays</i>.
                   </p>

                   {generatedSOP.analysis && Array.isArray(generatedSOP.analysis) ? (
                     <div className="space-y-4">
                       {generatedSOP.analysis.map((insight: any, idx: number) => (
                         <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group hover:border-brand-primary/30 transition-colors">
                           <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-green-500"></div>
                           <h5 className="font-bold text-sm text-gray-800 capitalize mb-1 pr-6 flex items-center gap-2">
                             Paragraph {idx + 1}: {insight.paragraph}
                           </h5>
                           <div className="inline-flex max-w-full text-xs font-semibold text-brand-primary bg-brand-primary/5 px-2 py-1 rounded-md mb-2 truncate">
                             {insight.principle}
                           </div>
                           <p className="text-sm text-gray-600 leading-relaxed">
                             {insight.explanation}
                           </p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-sm text-gray-400 italic p-4 bg-white rounded-xl border border-gray-100 text-center">
                       No analysis data returned.
                     </div>
                   )}
                 </div>
               </div>
             ) : (
                <div className="flex-1 flex items-center justify-center h-[400px]">
                   <p className="text-gray-400">Error rendering SOP. Please try again.</p>
                </div>
             )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 flex flex-col lg:flex-row gap-12 items-start">
      {/* Left Sidebar Stepper */}
      <div className="w-full lg:w-[280px] bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hidden lg:flex flex-col space-y-8 sticky top-12 flex-shrink-0">
        <h3 className="font-bold text-xl text-gray-900 tracking-tight mb-4">Application Setup</h3>
        <div className="flex flex-col space-y-8 relative">
          {/* Connecting line */}
          <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gray-100 z-0"></div>

          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || currentStep >= STEPS.length;
            
            return (
              <div key={step.id} className="flex gap-5 items-center relative z-10 transition-transform hover:translate-x-1 duration-200">
                {/* Step Connector Overlay for Active */}
                {isActive && index > 0 && <div className="absolute left-[23px] top-[-32px] h-[32px] w-[2px] bg-brand-primary origin-top"></div>}

                <div className={`w-[48px] h-[48px] rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 shadow-sm
                  ${isActive ? 'bg-brand-primary text-white scale-110 shadow-brand-primary/30' : 
                    isCompleted ? 'bg-brand-bot text-brand-primary border border-brand-primary/20' : 
                    'bg-white border text-gray-400 border-gray-200'}`}>
                  {isCompleted && !isActive ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-base transition-colors duration-300 ${isActive ? 'text-brand-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                  <span className={`text-sm ${isActive ? 'text-brand-primary/80' : 'text-gray-500'}`}>{step.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Top Stepper */}
      <div className="w-full lg:hidden flex justify-between items-center mb-6 px-2">
         {STEPS.map((step, index) => {
            const isActive = index <= currentStep;
            return (
              <div key={step.id} className={`h-2 flex-1 mx-1 rounded-full transition-colors duration-500 ${isActive ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            )
         })}
      </div>

      {/* Main Form Area */}
      <Card className="w-full flex-1 shadow-xl border border-gray-100 overflow-hidden rounded-3xl bg-white">
        <form id="wizard-form" onSubmit={(e) => e.preventDefault()}>
          <CardBody className="p-8 sm:p-14 min-h-[500px] overflow-hidden">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </CardBody>
          
          {/* Navigation Footer */}
        <Divider className="opacity-50" />
        <div className="px-8 py-6 sm:px-14 flex justify-between items-center bg-white rounded-b-3xl">
          {currentStep > 0 && currentStep < STEPS.length ? (
            <button 
              onClick={prevStep} 
              className="bg-white border-2 border-gray-100 text-gray-700 font-bold shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-95 px-8 h-14 rounded-2xl flex items-center justify-center gap-2" 
            >
              <ChevronLeft size={20} className="text-gray-500" />
              <span>Go Back</span>
            </button>
          ) : <div />}

          {currentStep < STEPS.length - 1 ? (
            <button 
              type="button"
              onClick={handleNextStepClick} 
              className="bg-brand-primary text-white font-bold text-base shadow-[0_8px_20px_rgba(4,77,207,0.25)] hover:shadow-[0_12px_25px_rgba(4,77,207,0.35)] hover:-translate-y-0.5 transition-all active:scale-95 px-10 h-14 rounded-2xl flex items-center justify-center gap-2 group"
            >
              <span>Next Step</span>
              <ChevronRight size={20} className="text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : currentStep === STEPS.length - 1 ? (
            <button 
              onClick={handleGenerateSOP}
              disabled={isGenerating}
              className="bg-brand-primary text-white font-bold text-base shadow-[0_8px_20px_rgba(4,77,207,0.25)] hover:shadow-[0_12px_25px_rgba(4,77,207,0.35)] hover:-translate-y-0.5 transition-all active:scale-95 px-10 h-14 rounded-2xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100" 
            >
              <span>{isGenerating ? "Generating..." : "Generate Output Essay"}</span>
              {!isGenerating && <ChevronRight size={20} className="text-white/80 group-hover:translate-x-1 transition-transform" />}
            </button>
          ) : (
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-brand-primary text-white font-bold text-base shadow-[0_8px_20px_rgba(4,77,207,0.25)] hover:shadow-[0_12px_25px_rgba(4,77,207,0.35)] hover:-translate-y-0.5 transition-all active:scale-95 px-10 h-14 rounded-2xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100" 
            >
              {isDownloading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={20} className="text-white/80 group-hover:translate-y-1 transition-transform" />
                  <span>Download Draft</span>
                </>
              )}
            </button>
          )}
        </div>
        </form>
      </Card>
    </div>
  );
}
