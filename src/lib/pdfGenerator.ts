import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { UserProfile } from '../types/user';
import type { Medication } from '../types/medication';
import type { VitalSign } from '../store/vitalsStore';
import type { DiagnosticState } from '../hooks/useDiagnosticState';

/**
 * Dynamically generates a beautiful PDF Health Resume and triggers downward transfer.
 */
export async function generateHealthResumePdf(
  profile: UserProfile,
  medications: Medication[],
  vitals: VitalSign[],
  aiInsight: string | null,
  diagnostic: DiagnosticState
): Promise<void> {
  // 1. Create a wrapper off-screen
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    width: '800px', // A4 width at 96 DPI approximations
    backgroundColor: '#ffffff',
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    color: '#111827',
    padding: '40px',
    paddingBottom: '60px',
  });

  const calculateAge = (dob: string) => {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  };
  const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : 'N/A';

  const activeMeds = medications.filter((m) => m.status === 'active');
  const pastSurgeries = profile.pastSurgeries?.length ? profile.pastSurgeries.join(', ') : 'None reported';
  const allergies = profile.allergies?.length ? profile.allergies.join(', ') : 'None reported';
  const chronic = profile.chronicConditions?.length ? profile.chronicConditions.join(', ') : 'None reported';

  // 2. Build the HTML content
  container.innerHTML = `
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E84040; padding-bottom: 20px; margin-bottom: 30px;">
      <div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #111827;">${profile.name}</h1>
        <h2 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 600; color: #4B5563;">Official Health Resume</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #9CA3AF;">Generated on ${new Date().toLocaleDateString()} | Sanjivani Health OS</p>
      </div>
      <div style="text-align: right; font-size: 14px; line-height: 1.5; color: #374151;">
        <div><strong>DOB:</strong> ${profile.dateOfBirth || 'N/A'} (Age: ${age})</div>
        <div><strong>Blood Type:</strong> ${profile.bloodType || 'N/A'}</div>
        <div><strong>Height:</strong> ${profile.heightCm || 'N/A'} cm | <strong>Weight:</strong> ${profile.weightKg || 'N/A'} kg</div>
        <div style="margin-top: 4px;"><strong>UID:</strong> ${profile.uid.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <!-- Alert Block for Allergies & Chronic -->
    <div style="display: flex; gap: 20px; margin-bottom: 30px;">
      <div style="flex: 1; min-height: 80px; padding: 15px; background: #FEE2E2; border-left: 4px solid #EF4444; border-radius: 8px;">
        <strong style="color: #B91C1C; display: block; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Allergies</strong>
        <p style="margin: 0; color: #7F1D1D; font-size: 13px;">${allergies}</p>
      </div>
      <div style="flex: 1; min-height: 80px; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px;">
        <strong style="color: #B45309; display: block; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Chronic Conditions</strong>
        <p style="margin: 0; color: #78350F; font-size: 13px;">${chronic}</p>
      </div>
    </div>

    <!-- Health & Diagnostics Synthesis -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Health & Diagnostics Synthesis</h3>
      
      <div style="padding: 15px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #374151; margin-bottom: 10px;">
        <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #111827;">Systemic Engine Overview</h4>
        <p style="margin: 0;">
          ${diagnostic.vitalAnomalies.length > 0 
            ? 'Detected physiological deviations: ' + diagnostic.vitalAnomalies.join('. ') + '. Correlating with current medication stack.'
            : 'Vitals are perfectly nominal. Correlating with stack confirms standard pharmacokinetic absorption with zero adverse impact.'}
        </p>
        <p style="margin: 6px 0 0 0; color: #DC2626;">
          ${diagnostic.vitalAnomalies.length > 0 && activeMeds.length > 0
            ? 'We noticed an anomaly in your vitals. <strong>' + activeMeds[0].brandName + '</strong> is active in your system and might be inducing these stress markers.'
            : ''}
        </p>
      </div>

      ${aiInsight ? 
      '<div style="padding: 15px; background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #881337;">' +
        '<h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #E11D48;">Deep AI Cycle Insight</h4>' +
        aiInsight.replace(/\\n/g, '<br/>') +
      '</div>'
       : ''}
    </div>

    <!-- Current Vitals -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Latest Vitals Snapshot</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        ${vitals.map(v => `
          <div style="padding: 12px; background: #fff; border: 1px solid #E5E7EB; border-radius: 8px;">
            <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600;">${v.label}</div>
            <div style="font-size: 18px; font-weight: 700; color: #111827; margin: 4px 0;">
              ${v.id === 'bp' ? v.sys + '/' + v.dia : v.value} <span style="font-size: 12px; font-weight: 500; color: #6B7280;">${v.unit}</span>
            </div>
            <div style="font-size: 11px; font-weight: 600; color: ${v.status === 'optimal' || v.status === 'normal' ? '#10B981' : v.status === 'critical' ? '#EF4444' : '#F59E0B'}">${v.status.toUpperCase()}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Active Medications -->
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Active Daily Medications</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #F3F4F6;">
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">Medication</th>
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">Dosage</th>
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #E5E7EB; color: #4B5563;">Schedule</th>
          </tr>
        </thead>
        <tbody>
          ${activeMeds.length > 0 ? activeMeds.map(m => `
            <tr>
              <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB;">
                <strong>${m.brandName || m.genericName}</strong><br/>
                <span style="font-size: 11px; color: #6B7280;">${m.genericName}</span>
              </td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB;">${m.dosage || 'N/A'}</td>
              <td style="padding: 12px 10px; border-bottom: 1px solid #E5E7EB;">
                ${m.schedule.map(s => `${s.time} (${s.quantity} ${s.unit})`).join(', ')}
              </td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="3" style="padding: 15px 10px; text-align: center; color: #6B7280; border-bottom: 1px solid #E5E7EB;">No active medications found.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Additional Details -->
    <div>
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Surgical History & Lifestyle</h3>
      <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Past Surgeries:</strong> ${pastSurgeries}</p>
      ${profile.lifestyle ? `
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Smoker:</strong> ${profile.lifestyle.smoking ? 'Yes' : 'No'} | <strong>Alcohol:</strong> ${profile.lifestyle.alcohol ? 'Yes' : 'No'}</p>
        <p style="font-size: 13px; color: #374151; margin: 0 0 8px 0;"><strong>Diet:</strong> ${profile.lifestyle.diet}</p>
        <p style="font-size: 13px; color: #374151; margin: 0;"><strong>Activity Level:</strong> ${profile.lifestyle.physicalActivity}</p>
      ` : ''}
    </div>
  `;

  document.body.appendChild(container);

  try {
    // 3. Render Canvas
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
    });

    // 4. Build PDF
    const imgData = canvas.toDataURL('image/png');
    // jsPDF uses portrait A4 (210x297 mm)
    // We scale the image to fit the width perfectly
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

    // 5. Trigger download
    const filename = `${profile.name.replace(/\\s+/g, '_')}_Health_Resume.pdf`;
    pdf.save(filename);
  } finally {
    // Cleanup
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
