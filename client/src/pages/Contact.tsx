import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, Check } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead.tsx';
import { useSettingsStore } from '../store/settings.ts';

export const Contact: React.FC = () => {
  const { settings } = useSettingsStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const waNumber = settings.whatsapp_number || '212600112233';
  const contactEmail = settings.contact_email || 'support@motopaco.com';
  const storeAddress = settings.store_address || 'Moto paco, Lotissement assaada n92 et ain atiq temara, Ain atiq 12000';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && message.trim()) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-28 pb-16 text-[#111827]">
      <SEOHead
        title="Contact & Showroom Moto au Maroc | MOTO PACO"
        description="Trouvez notre showroom d'équipements moto à Témara / Aïn Attiq. Contactez-nous par email ou via notre support WhatsApp direct."
      />

      <div className="max-w-[1650px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <p className="text-[#E63012] font-mono text-xs font-bold tracking-widest uppercase">DISPONIBLES SUR LA GRILLE</p>
          <h1 className="race-livery text-3xl sm:text-5xl text-[#111827] mt-2">CONTACTEZ MOTO PACO</h1>
          <p className="text-[#4B5563] text-sm max-w-lg mx-auto mt-2 leading-relaxed font-body">
            Une question sur une taille de casque ou la compatibilité d'un kit chaîne ? Notre équipe de motards vous répond en quelques minutes.
          </p>
        </div>

        {/* Showroom Contacts Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Main Showroom & Boutique */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4 hover:border-[#E63012] transition-colors">
            <div className="bg-[#E63012]/10 p-3 rounded w-fit">
              <MapPin className="w-6 h-6 text-[#E63012]" />
            </div>
            <h3 className="font-display font-black italic text-xl uppercase tracking-wider">Showroom Témara / Aïn Attiq</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              {storeAddress}
            </p>
            <div className="space-y-2 text-xs font-mono">
              <p className="flex items-center text-[#111827]"><Phone className="w-4 h-4 text-[#E63012] mr-2" /> +{waNumber}</p>
              <p className="flex items-center text-[#4B5563]"><Clock className="w-4 h-4 text-[#E63012] mr-2" /> Lun - Sam : 09:30 - 19:30</p>
            </div>
          </div>

          {/* Customer Service */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 space-y-4 hover:border-[#E63012] transition-colors">
            <div className="bg-[#22C55E]/10 p-3 rounded w-fit">
              <MessageSquare className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h3 className="font-display font-black italic text-xl uppercase tracking-wider">Service Client Digital</h3>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Assistance technique en ligne, validation de commande express et SAV WhatsApp.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <p className="flex items-center text-[#111827]"><Phone className="w-4 h-4 text-[#22C55E] mr-2" /> +{waNumber}</p>
              <p className="flex items-center text-[#4B5563]"><Mail className="w-4 h-4 text-[#22C55E] mr-2" /> {contactEmail}</p>
            </div>
          </div>

        </div>

        {/* Contact Form and Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Contact form */}
          <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E5E7EB] rounded p-6 sm:p-8 space-y-6">
            <h3 className="font-display font-black italic text-lg uppercase tracking-wider text-[#111827]">
              Formulaire de contact
            </h3>
            
            {submitted ? (
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#111827] p-6 rounded text-center space-y-2">
                <Check className="w-8 h-8 text-[#22C55E] mx-auto" />
                <h4 className="font-bold text-sm">Message Envoyé !</h4>
                <p className="text-xs text-[#4B5563] leading-relaxed">Notre équipe commerciale traitera votre demande et vous répondra sous 2 heures.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Votre Nom <span className="text-[#E63012]">*</span></label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-xs text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Votre Email <span className="text-[#E63012]">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-xs text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Téléphone (Optionnel)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-xs text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#4B5563] uppercase">Sujet <span className="text-[#E63012]">*</span></label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-xs text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#4B5563] uppercase">Votre Message <span className="text-[#E63012]">*</span></label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-[#F9FAFB] border border-[#E5E7EB] rounded px-4 py-3 text-xs text-[#111827] w-full focus:outline-none focus:border-[#E63012]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E63012] hover:bg-[#111827] text-white py-3.5 rounded font-display text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5 shadow red-glow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer la demande</span>
                </button>
              </form>
            )}

          </div>

          {/* Showroom Interactive Map Frame */}
          <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E5E7EB] rounded overflow-hidden h-96">
            <iframe
              title="Showroom MOTO PACO Témara Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3803.721130570378!2d-6.9692704!3d33.88749800000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda70d59cab0847f%3A0xc08df9e994c83c8b!2sMoto%20paco!5e1!3m2!1sen!2sma!4v1780678711436!5m2!1sen!2sma"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
