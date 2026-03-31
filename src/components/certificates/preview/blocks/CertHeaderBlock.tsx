import { useCertificateStore } from '../../store/certificate-template.store';
import { replaceCertificateVariables } from '../../utils/cert-variable-engine';

export default function CertHeaderBlock({ mockData }: { mockData?: any }) {
  const { template } = useCertificateStore();
  const block = template.blocks.find(b => b.type === 'header');
  const logo = template.branding.logo;

  if (!block || !block.enabled) return null;

  const contentConfig = block.contentConfig || {};
  const rawTitle = contentConfig.title || '{{clinic_name}}';
  const rawSubtitle = contentConfig.subtitle || 'Certificado Médico';
  const rawContactInfo = contentConfig.contactInfo || '{{clinic_address}}\nTel: {{clinic_phone}}';

  const title = replaceCertificateVariables(rawTitle, mockData);
  const subtitle = replaceCertificateVariables(rawSubtitle, mockData);
  const contactInfo = replaceCertificateVariables(rawContactInfo, mockData);

  const logoPosition = logo?.position || 'left';
  const hasLogo = !!logo?.url;

  // Render text content
  const renderTextContent = (alignment: 'left' | 'center' | 'right' = 'left') => (
    <div className={`flex flex-col flex-1 text-${alignment} space-y-1`}>
      {title && <h1 className="text-xl font-bold text-[var(--primary-color)] tracking-tight leading-tight uppercase relative z-10 break-all">{title}</h1>}
      {subtitle && <h2 className="text-sm font-semibold text-[var(--secondary-color)] leading-snug uppercase relative z-10 break-all">{subtitle}</h2>}
      {contactInfo && (
        <div className="text-[10px] text-[var(--text-color)] opacity-80 mt-1.5 whitespace-pre-wrap leading-tight relative z-10 border-t border-gray-100 pt-1.5 break-words">
          {contactInfo}
        </div>
      )}
    </div>
  );

  // Render Logo
  const renderLogo = () => {
    if (!hasLogo) return null;
    return (
      <div 
        className="relative mix-blend-multiply flex-shrink-0"
        style={{ 
          width: `${logo.width || 60}px`,
          height: `${logo.height || 60}px`
        }}
      >
        <img src={logo.url} alt="Logo" className="w-full h-full object-contain" />
      </div>
    );
  };

  return (
    <div className="flex w-full mb-6 relative">
      <div className="w-full flex items-center justify-between gap-6 bg-white shrink-0" style={{ [block.style?.align as string || 'alignItems']: 'center' }}>
        
        {/* Layout based on logo position */}
        {logoPosition === 'left' && (
          <>
            {renderLogo()}
            {renderTextContent(hasLogo ? 'right' : 'left')}
          </>
        )}

        {logoPosition === 'right' && (
          <>
            {renderTextContent(hasLogo ? 'left' : 'right')}
            {renderLogo()}
          </>
        )}

        {logoPosition === 'center' && (
          <div className="w-full flex flex-col items-center justify-center text-center space-y-4">
            {renderLogo()}
            <div className="flex flex-col text-center space-y-1 w-full max-w-2xl">
              {title && <h1 className="text-2xl font-black text-[var(--primary-color)] tracking-tight leading-none uppercase">{title}</h1>}
              {subtitle && <h2 className="text-sm font-bold text-[var(--secondary-color)] uppercase tracking-wide opacity-90">{subtitle}</h2>}
              {contactInfo && (
                <div className="text-[10px] text-[var(--text-color)] opacity-70 mt-2 whitespace-pre-wrap leading-relaxed mx-auto border-t border-gray-200/60 pt-2 w-3/4">
                  {contactInfo}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
