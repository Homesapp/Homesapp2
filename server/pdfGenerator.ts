import PDFDocument from 'pdfkit';

export async function generateOfferPDF(offerData: any, property: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#3b82f6';
      const secondaryColor = '#64748b';
      const accentColor = '#10b981';
      const bgColor = '#f8fafc';
      const borderColor = '#e2e8f0';

      // Header with background
      doc.rect(0, 0, 595, 120)
        .fillColor('#1e40af')
        .fill();

      doc.fontSize(32)
        .fillColor('#ffffff')
        .text('HomesApp', 50, 35);

      doc.fontSize(14)
        .fillColor('#bfdbfe')
        .text('Tulum Rental Homes ™', 50, 75);

      // Title Section
      doc.fontSize(24)
        .fillColor('#1e293b')
        .text('Oferta de Renta', 50, 150);

      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`Generada el ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, 185);

      doc.moveTo(50, 210)
        .lineTo(545, 210)
        .strokeColor(borderColor)
        .lineWidth(2)
        .stroke();

      let yPosition = 230;

      // Property Section with background box
      doc.rect(50, yPosition - 5, 495, 90)
        .fillColor(bgColor)
        .fill();

      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('PROPIEDAD', 60, yPosition + 5);
      
      yPosition += 30;
      doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(`${property.title || 'Sin título'}`, 60, yPosition);
      
      yPosition += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text(`${property.address || 'Dirección no disponible'}`, 60, yPosition);

      if (property.monthlyRentPrice) {
        yPosition += 18;
        doc.fontSize(10)
          .fillColor(secondaryColor)
          .text('Renta mensual solicitada: ', 60, yPosition, { continued: true })
          .fontSize(11)
          .fillColor(accentColor)
          .font('Helvetica-Bold')
          .text(`$${property.monthlyRentPrice.toLocaleString()} ${property.currency || 'USD'}`);
        doc.font('Helvetica');
      }

      yPosition += 50;

      // Client Information Section
      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('INFORMACIÓN DEL SOLICITANTE', 50, yPosition);

      yPosition += 25;
      const clientInfo = [
        { label: 'Nombre completo', value: offerData.fullName },
        { label: 'Email', value: offerData.email },
        { label: 'Teléfono', value: offerData.phone },
        { label: 'Nacionalidad', value: offerData.nationality },
        { label: 'Ocupación', value: offerData.occupation },
      ];

      clientInfo.forEach(({ label, value }) => {
        if (value) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text(`${label}:`, 50, yPosition);
          
          doc.fontSize(10)
            .fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(value, 180, yPosition);
          
          doc.font('Helvetica');
          yPosition += 20;
        }
      });

      yPosition += 15;

      // Offer Details Section with highlight box
      doc.rect(50, yPosition - 5, 495, 120)
        .fillColor('#ecfdf5')
        .fill();

      doc.fontSize(16)
        .fillColor(accentColor)
        .text('DETALLES DE LA OFERTA', 60, yPosition + 5);

      yPosition += 30;
      const offerDetails = [
        { 
          label: 'Renta mensual ofertada', 
          value: offerData.monthlyRent ? `$${parseFloat(offerData.monthlyRent).toLocaleString()} ${offerData.currency || 'USD'}` : 'No especificado',
          highlight: true
        },
        { label: 'Tipo de uso', value: offerData.usageType === 'vivienda' ? 'Vivienda' : 'Subarrendamiento' },
        { label: 'Duración del contrato', value: offerData.contractDuration || 'No especificado' },
        { label: 'Fecha de ingreso', value: offerData.moveInDate ? new Date(offerData.moveInDate).toLocaleDateString('es-MX') : 'No especificada' },
        { label: 'Número de ocupantes', value: offerData.numberOfOccupants || 'No especificado' },
      ];

      offerDetails.forEach(({ label, value, highlight }) => {
        doc.fontSize(9)
          .fillColor(secondaryColor)
          .text(`${label}:`, 60, yPosition);
        
        doc.fontSize(highlight ? 12 : 10)
          .fillColor(highlight ? accentColor : '#1e293b')
          .font(highlight ? 'Helvetica-Bold' : 'Helvetica')
          .text(value, 200, yPosition - (highlight ? 1 : 0));
        
        doc.font('Helvetica');
        yPosition += 20;
      });

      yPosition += 20;

      // Services Section
      if ((offerData.offeredServices && offerData.offeredServices.length > 0) || 
          (offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0)) {
        
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('SERVICIOS', 50, yPosition);

        yPosition += 25;

        if (offerData.offeredServices && offerData.offeredServices.length > 0) {
          doc.fontSize(11)
            .fillColor(secondaryColor)
            .text('Servicios que el cliente ofrece pagar:', 50, yPosition);
          
          yPosition += 18;
          offerData.offeredServices.forEach((service: string) => {
            doc.fontSize(10)
              .fillColor('#1e293b')
              .text(`✓ ${service}`, 70, yPosition);
            yPosition += 16;
          });
          yPosition += 10;
        }

        if (offerData.propertyRequiredServices && offerData.propertyRequiredServices.length > 0) {
          doc.fontSize(11)
            .fillColor(secondaryColor)
            .text('Servicios requeridos por el propietario:', 50, yPosition);
          
          yPosition += 18;
          offerData.propertyRequiredServices.forEach((service: string) => {
            doc.fontSize(10)
              .fillColor('#1e293b')
              .text(`• ${service}`, 70, yPosition);
            yPosition += 16;
          });
        }

        yPosition += 15;
      }

      // Pets Section
      if (offerData.pets) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('MASCOTAS', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .font('Helvetica-Bold')
          .text(offerData.pets === 'yes' ? 'Sí, tiene mascotas' : 'No tiene mascotas', 50, yPosition);
        
        doc.font('Helvetica');
        
        if (offerData.pets === 'yes' && offerData.petDetails) {
          yPosition += 20;
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text('Detalles:', 50, yPosition);
          yPosition += 16;
          doc.fontSize(10)
            .fillColor('#1e293b')
            .text(offerData.petDetails, 50, yPosition, { width: 495 });
          yPosition += Math.ceil(offerData.petDetails.length / 80) * 14 + 10;
        }

        yPosition += 15;
      }

      // Additional Comments
      if (offerData.additionalComments) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('COMENTARIOS ADICIONALES', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .text(offerData.additionalComments, 50, yPosition, { width: 495 });
      }

      // Footer
      doc.rect(0, doc.page.height - 60, 595, 60)
        .fillColor('#f1f5f9')
        .fill();

      doc.fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Este documento es una oferta de renta generada automáticamente por HomesApp.',
          50,
          doc.page.height - 45,
          { width: 495, align: 'center' }
        );
      
      doc.fontSize(7)
        .fillColor(secondaryColor)
        .text(
          'HomesApp se reserva el derecho de aprobar o rechazar ofertas según políticas internas.',
          50,
          doc.page.height - 25,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateRentalFormPDF(tenantData: any, property: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#3b82f6';
      const secondaryColor = '#64748b';
      const accentColor = '#10b981';
      const bgColor = '#f8fafc';
      const borderColor = '#e2e8f0';

      // Header with background
      doc.rect(0, 0, 595, 120)
        .fillColor('#1e40af')
        .fill();

      doc.fontSize(32)
        .fillColor('#ffffff')
        .text('HomesApp', 50, 35);

      doc.fontSize(14)
        .fillColor('#bfdbfe')
        .text('Tulum Rental Homes ™', 50, 75);

      // Title Section
      doc.fontSize(24)
        .fillColor('#1e293b')
        .text('Formulario de Inquilino', 50, 150);

      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`Generado el ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, 185);

      doc.moveTo(50, 210)
        .lineTo(545, 210)
        .strokeColor(borderColor)
        .lineWidth(2)
        .stroke();

      let yPosition = 230;

      // Property Section
      doc.rect(50, yPosition - 5, 495, 70)
        .fillColor(bgColor)
        .fill();

      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('PROPIEDAD', 60, yPosition + 5);
      
      yPosition += 30;
      doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(`${property.title || 'Sin título'}`, 60, yPosition);
      
      yPosition += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text(`${property.address || 'Dirección no disponible'}`, 60, yPosition);

      yPosition += 50;

      // Tenant Personal Information
      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('INFORMACIÓN PERSONAL', 50, yPosition);

      yPosition += 25;
      const personalInfo = [
        { label: 'Nombre completo', value: tenantData.fullName },
        { label: 'Email', value: tenantData.email },
        { label: 'Teléfono', value: tenantData.phone },
        { label: 'Fecha de nacimiento', value: tenantData.birthDate ? new Date(tenantData.birthDate).toLocaleDateString('es-MX') : null },
        { label: 'Nacionalidad', value: tenantData.nationality },
      ];

      personalInfo.forEach(({ label, value }) => {
        if (value) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text(`${label}:`, 50, yPosition);
          
          doc.fontSize(10)
            .fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(value, 180, yPosition);
          
          doc.font('Helvetica');
          yPosition += 20;
        }
      });

      yPosition += 15;

      // Employment Information
      if (tenantData.employmentStatus || tenantData.monthlyIncome) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('INFORMACIÓN LABORAL', 50, yPosition);

        yPosition += 25;
        const employmentInfo = [
          { label: 'Estatus laboral', value: tenantData.employmentStatus },
          { label: 'Ingreso mensual', value: tenantData.monthlyIncome ? `$${parseFloat(tenantData.monthlyIncome).toLocaleString()} USD` : null },
          { label: 'Empresa', value: tenantData.employerName },
        ];

        employmentInfo.forEach(({ label, value }) => {
          if (value) {
            doc.fontSize(9)
              .fillColor(secondaryColor)
              .text(`${label}:`, 50, yPosition);
            
            doc.fontSize(10)
              .fillColor('#1e293b')
              .font('Helvetica-Bold')
              .text(value, 180, yPosition);
            
            doc.font('Helvetica');
            yPosition += 20;
          }
        });

        yPosition += 15;
      }

      // References
      if (tenantData.references && tenantData.references.length > 0) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('REFERENCIAS', 50, yPosition);

        yPosition += 25;
        tenantData.references.forEach((ref: any, index: number) => {
          doc.fontSize(11)
            .fillColor(secondaryColor)
            .font('Helvetica-Bold')
            .text(`Referencia ${index + 1}`, 50, yPosition);
          
          yPosition += 18;
          doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#1e293b')
            .text(`Nombre: ${ref.name || 'No especificado'}`, 70, yPosition);
          yPosition += 16;
          doc.text(`Teléfono: ${ref.phone || 'No especificado'}`, 70, yPosition);
          yPosition += 16;
          doc.text(`Relación: ${ref.relationship || 'No especificado'}`, 70, yPosition);
          yPosition += 25;
        });
      }

      // Additional Information
      if (tenantData.hasPets || tenantData.hasVehicle) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('INFORMACIÓN ADICIONAL', 50, yPosition);

        yPosition += 25;
        if (tenantData.hasPets) {
          doc.fontSize(10)
            .fillColor(secondaryColor)
            .text('Mascotas:', 50, yPosition);
          doc.fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(tenantData.hasPets === 'yes' ? 'Sí' : 'No', 180, yPosition);
          doc.font('Helvetica');
          yPosition += 20;
        }
        if (tenantData.hasVehicle) {
          doc.fontSize(10)
            .fillColor(secondaryColor)
            .text('Vehículo:', 50, yPosition);
          doc.fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(tenantData.hasVehicle === 'yes' ? 'Sí' : 'No', 180, yPosition);
          doc.font('Helvetica');
          yPosition += 20;
        }
      }

      // Footer
      doc.rect(0, doc.page.height - 60, 595, 60)
        .fillColor('#f1f5f9')
        .fill();

      doc.fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Este documento es un formulario de inquilino generado automáticamente por HomesApp.',
          50,
          doc.page.height - 45,
          { width: 495, align: 'center' }
        );
      
      doc.fontSize(7)
        .fillColor(secondaryColor)
        .text(
          'HomesApp se reserva el derecho de aprobar o rechazar solicitudes según políticas internas.',
          50,
          doc.page.height - 25,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateOwnerFormPDF(ownerData: any, property: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#3b82f6';
      const secondaryColor = '#64748b';
      const accentColor = '#10b981';
      const bgColor = '#f8fafc';
      const borderColor = '#e2e8f0';

      // Header with background
      doc.rect(0, 0, 595, 120)
        .fillColor('#1e40af')
        .fill();

      doc.fontSize(32)
        .fillColor('#ffffff')
        .text('HomesApp', 50, 35);

      doc.fontSize(14)
        .fillColor('#bfdbfe')
        .text('Tulum Rental Homes ™', 50, 75);

      // Title Section
      doc.fontSize(24)
        .fillColor('#1e293b')
        .text('Formulario de Propietario', 50, 150);

      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`Generado el ${new Date().toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, 185);

      doc.moveTo(50, 210)
        .lineTo(545, 210)
        .strokeColor(borderColor)
        .lineWidth(2)
        .stroke();

      let yPosition = 230;

      // Property Section
      doc.rect(50, yPosition - 5, 495, 70)
        .fillColor(bgColor)
        .fill();

      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('PROPIEDAD', 60, yPosition + 5);
      
      yPosition += 30;
      doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(`${property.title || 'Sin título'}`, 60, yPosition);
      
      yPosition += 20;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor(secondaryColor)
        .text(`${property.address || 'Dirección no disponible'}`, 60, yPosition);

      yPosition += 50;

      // Owner Personal Information
      doc.fontSize(16)
        .fillColor(primaryColor)
        .text('INFORMACIÓN DEL PROPIETARIO', 50, yPosition);

      yPosition += 25;
      const ownerInfo = [
        { label: 'Nombre completo', value: ownerData.fullName },
        { label: 'Email', value: ownerData.email },
        { label: 'Teléfono', value: ownerData.phone },
        { label: 'Nacionalidad', value: ownerData.nationality },
        { label: 'Dirección', value: ownerData.address },
      ];

      ownerInfo.forEach(({ label, value }) => {
        if (value) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text(`${label}:`, 50, yPosition);
          
          doc.fontSize(10)
            .fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(value, 180, yPosition);
          
          doc.font('Helvetica');
          yPosition += 20;
        }
      });

      yPosition += 15;

      // Bank Information
      if (ownerData.bankName || ownerData.accountNumber) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('INFORMACIÓN BANCARIA', 50, yPosition);

        yPosition += 25;
        const bankInfo = [
          { label: 'Banco', value: ownerData.bankName },
          { label: 'Número de cuenta', value: ownerData.accountNumber },
          { label: 'CLABE', value: ownerData.clabe },
        ];

        bankInfo.forEach(({ label, value }) => {
          if (value) {
            doc.fontSize(9)
              .fillColor(secondaryColor)
              .text(`${label}:`, 50, yPosition);
            
            doc.fontSize(10)
              .fillColor('#1e293b')
              .font('Helvetica-Bold')
              .text(value, 180, yPosition);
            
            doc.font('Helvetica');
            yPosition += 20;
          }
        });

        yPosition += 15;
      }

      // Property Preferences
      if (ownerData.preferredRentAmount || ownerData.minimumContractDuration) {
        doc.fontSize(16)
          .fillColor(primaryColor)
          .text('PREFERENCIAS DE RENTA', 50, yPosition);

        yPosition += 25;
        const preferences = [
          { label: 'Renta preferida', value: ownerData.preferredRentAmount ? `$${parseFloat(ownerData.preferredRentAmount).toLocaleString()} USD` : null },
          { label: 'Duración mínima', value: ownerData.minimumContractDuration },
          { label: 'Acepta mascotas', value: ownerData.acceptsPets === 'yes' ? 'Sí' : ownerData.acceptsPets === 'no' ? 'No' : null },
        ];

        preferences.forEach(({ label, value }) => {
          if (value) {
            doc.fontSize(9)
              .fillColor(secondaryColor)
              .text(`${label}:`, 50, yPosition);
            
            doc.fontSize(10)
              .fillColor('#1e293b')
              .font('Helvetica-Bold')
              .text(value, 180, yPosition);
            
            doc.font('Helvetica');
            yPosition += 20;
          }
        });
      }

      // Footer
      doc.rect(0, doc.page.height - 60, 595, 60)
        .fillColor('#f1f5f9')
        .fill();

      doc.fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Este documento es un formulario de propietario generado automáticamente por HomesApp.',
          50,
          doc.page.height - 45,
          { width: 495, align: 'center' }
        );
      
      doc.fontSize(7)
        .fillColor(secondaryColor)
        .text(
          'HomesApp se reserva el derecho de aprobar o rechazar solicitudes según políticas internas.',
          50,
          doc.page.height - 25,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateQuotationPDF(
  quotationData: any, 
  agencyData?: { name?: string; logo?: string; contact?: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const primaryColor = '#3b82f6';
      const secondaryColor = '#64748b';
      const accentColor = '#10b981';
      const bgColor = '#f8fafc';
      const borderColor = '#e2e8f0';
      const warningColor = '#f59e0b';

      // Header with dual branding
      doc.rect(0, 0, 595, 140)
        .fillColor('#1e40af')
        .fill();

      // HomesApp logo (left side)
      doc.fontSize(28)
        .fillColor('#ffffff')
        .text('HomesApp', 50, 35);

      doc.fontSize(12)
        .fillColor('#bfdbfe')
        .text('Tulum Rental Homes ™', 50, 70);

      // Agency name (right side) if provided
      if (agencyData?.name) {
        doc.fontSize(14)
          .fillColor('#ffffff')
          .text(agencyData.name, 350, 40, { width: 195, align: 'right' });
        
        if (agencyData.contact) {
          doc.fontSize(9)
            .fillColor('#bfdbfe')
            .text(agencyData.contact, 350, 65, { width: 195, align: 'right' });
        }
      }

      // Quotation title
      doc.fontSize(26)
        .fillColor('#1e293b')
        .text('COTIZACIÓN DE MANTENIMIENTO', 50, 165);

      // Quotation metadata
      let yPosition = 205;
      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`No. Cotización: ${quotationData.id || 'N/A'}`, 50, yPosition);
      
      doc.text(
        `Fecha: ${new Date(quotationData.createdAt || Date.now()).toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric'
        })}`,
        350,
        yPosition,
        { width: 195, align: 'right' }
      );

      yPosition += 25;

      // Status badge
      const statusColors: Record<string, string> = {
        draft: secondaryColor,
        sent: primaryColor,
        accepted: accentColor,
        rejected: '#ef4444',
        cancelled: secondaryColor
      };
      
      const statusLabels: Record<string, string> = {
        draft: 'BORRADOR',
        sent: 'ENVIADA',
        accepted: 'ACEPTADA',
        rejected: 'RECHAZADA',
        cancelled: 'CANCELADA'
      };

      const status = quotationData.status || 'draft';
      const statusColor = statusColors[status] || secondaryColor;
      const statusLabel = statusLabels[status] || status.toUpperCase();

      doc.fontSize(10)
        .fillColor(statusColor)
        .font('Helvetica-Bold')
        .text(`Estado: ${statusLabel}`, 50, yPosition);
      doc.font('Helvetica');

      yPosition += 10;
      doc.moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .strokeColor(borderColor)
        .lineWidth(2)
        .stroke();

      yPosition += 25;

      // Client Information Section
      if (quotationData.clientName || quotationData.clientEmail || quotationData.clientPhone) {
        // Check if we need a new page
        if (yPosition > 680) {
          doc.addPage();
          yPosition = 50;
        }

        doc.rect(50, yPosition - 5, 495, 80)
          .fillColor(bgColor)
          .fill();

        doc.fontSize(14)
          .fillColor(primaryColor)
          .text('INFORMACIÓN DEL CLIENTE', 60, yPosition + 5);

        yPosition += 30;
        
        if (quotationData.clientName) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text('Cliente:', 60, yPosition);
          doc.fontSize(11)
            .fillColor('#1e293b')
            .font('Helvetica-Bold')
            .text(quotationData.clientName, 180, yPosition);
          doc.font('Helvetica');
          yPosition += 18;
        }

        if (quotationData.clientEmail) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text('Email:', 60, yPosition);
          doc.fontSize(10)
            .fillColor('#1e293b')
            .text(quotationData.clientEmail, 180, yPosition);
          yPosition += 18;
        }

        if (quotationData.clientPhone) {
          doc.fontSize(9)
            .fillColor(secondaryColor)
            .text('Teléfono:', 60, yPosition);
          doc.fontSize(10)
            .fillColor('#1e293b')
            .text(quotationData.clientPhone, 180, yPosition);
          yPosition += 18;
        }

        yPosition += 20;
      }

      // Description Section
      if (quotationData.description) {
        // Check if we need a new page
        if (yPosition > 680) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(14)
          .fillColor(primaryColor)
          .text('DESCRIPCIÓN', 50, yPosition);

        yPosition += 25;
        doc.fontSize(10)
          .fillColor('#1e293b')
          .text(quotationData.description, 50, yPosition, { width: 495 });
        
        const descLines = Math.ceil(quotationData.description.length / 80);
        yPosition += descLines * 14 + 25;
      }

      // Services Table Header
      // Check if we need a new page
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14)
        .fillColor(primaryColor)
        .text('SERVICIOS', 50, yPosition);

      yPosition += 25;

      // Table header
      doc.rect(50, yPosition, 495, 30)
        .fillColor('#1e40af')
        .fill();

      doc.fontSize(9)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('DESCRIPCIÓN', 60, yPosition + 10, { width: 230 })
        .text('CANT.', 295, yPosition + 10, { width: 45, align: 'center' })
        .text('PRECIO UNIT.', 345, yPosition + 10, { width: 85, align: 'right' })
        .text('SUBTOTAL', 435, yPosition + 10, { width: 100, align: 'right' });
      
      doc.font('Helvetica');
      yPosition += 30;

      // Services rows
      const services = quotationData.services || [];
      services.forEach((service: any, index: number) => {
        // Check if we need a new page before writing service row
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
          
          // Re-render table header on new page
          doc.rect(50, yPosition, 495, 30)
            .fillColor('#1e40af')
            .fill();

          doc.fontSize(9)
            .fillColor('#ffffff')
            .font('Helvetica-Bold')
            .text('DESCRIPCIÓN', 60, yPosition + 10, { width: 230 })
            .text('CANT.', 295, yPosition + 10, { width: 45, align: 'center' })
            .text('PRECIO UNIT.', 345, yPosition + 10, { width: 85, align: 'right' })
            .text('SUBTOTAL', 435, yPosition + 10, { width: 100, align: 'right' });
          
          doc.font('Helvetica');
          yPosition += 30;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(50, yPosition, 495, 25)
            .fillColor(bgColor)
            .fill();
        }

        // Use precomputed subtotal if available, otherwise calculate
        const subtotal = service.subtotal ?? ((service.quantity || 0) * (service.unitPrice || 0));

        doc.fontSize(9)
          .fillColor('#1e293b')
          .text(service.description || 'N/A', 60, yPosition + 8, { width: 230 })
          .text(String(service.quantity || 0), 295, yPosition + 8, { width: 45, align: 'center' })
          .fillColor(secondaryColor)
          .text(`$${(service.unitPrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 345, yPosition + 8, { width: 85, align: 'right' })
          .fillColor('#1e293b')
          .font('Helvetica-Bold')
          .text(`$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 435, yPosition + 8, { width: 100, align: 'right' });
        
        doc.font('Helvetica');
        yPosition += 25;
      });

      // Check if we need a new page for financials
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      yPosition += 15;

      // Financials Section
      doc.rect(50, yPosition, 495, 90)
        .fillColor('#ecfdf5')
        .fill();

      yPosition += 15;

      // Subtotal
      doc.fontSize(11)
        .fillColor(secondaryColor)
        .text('Subtotal:', 350, yPosition, { width: 85, align: 'right' });
      
      doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(
          `$${(quotationData.financials?.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          435,
          yPosition,
          { width: 100, align: 'right' }
        );
      
      doc.font('Helvetica');
      yPosition += 25;

      // Admin Fee
      const adminFeePercentage = quotationData.financials?.adminFeePercentage || 15;
      doc.fontSize(10)
        .fillColor(secondaryColor)
        .text(`Tarifa administrativa (${adminFeePercentage}%):`, 350, yPosition, { width: 85, align: 'right' });
      
      doc.fontSize(11)
        .fillColor(warningColor)
        .font('Helvetica-Bold')
        .text(
          `$${(quotationData.financials?.adminFee || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          435,
          yPosition,
          { width: 100, align: 'right' }
        );
      
      doc.font('Helvetica');
      yPosition += 30;

      // Total
      doc.moveTo(350, yPosition - 5)
        .lineTo(545, yPosition - 5)
        .strokeColor(accentColor)
        .lineWidth(2)
        .stroke();

      doc.fontSize(13)
        .fillColor(secondaryColor)
        .text('TOTAL:', 350, yPosition, { width: 85, align: 'right' });
      
      // Use stored currency or default to MXN
      const currency = quotationData.financials?.currency || quotationData.currency || 'MXN';
      
      doc.fontSize(16)
        .fillColor(accentColor)
        .font('Helvetica-Bold')
        .text(
          `$${(quotationData.financials?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${currency}`,
          435,
          yPosition - 2,
          { width: 100, align: 'right' }
        );
      
      doc.font('Helvetica');
      yPosition += 40;

      // Terms and Conditions
      if (quotationData.terms) {
        // Check if we need a new page
        if (yPosition > 600) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(14)
          .fillColor(primaryColor)
          .text('TÉRMINOS Y CONDICIONES', 50, yPosition);

        yPosition += 25;
        doc.fontSize(9)
          .fillColor('#1e293b')
          .text(quotationData.terms, 50, yPosition, { width: 495, align: 'justify' });
      }

      // Footer
      doc.rect(0, doc.page.height - 70, 595, 70)
        .fillColor('#f1f5f9')
        .fill();

      doc.fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Esta cotización es válida por 30 días a partir de la fecha de emisión.',
          50,
          doc.page.height - 55,
          { width: 495, align: 'center' }
        );
      
      doc.fontSize(7)
        .fillColor(secondaryColor)
        .text(
          agencyData?.name 
            ? `${agencyData.name} | Powered by HomesApp`
            : 'Powered by HomesApp - Sistema de Gestión de Propiedades',
          50,
          doc.page.height - 35,
          { width: 495, align: 'center' }
        );
      
      doc.fontSize(7)
        .fillColor(secondaryColor)
        .text(
          `Generado el ${new Date().toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          50,
          doc.page.height - 20,
          { width: 495, align: 'center' }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
