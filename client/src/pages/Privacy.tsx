export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" data-testid="heading-privacy">
        Política de Privacidad
      </h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Información que Recopilamos</h2>
          <p className="text-muted-foreground">
            Recopilamos información personal cuando se registra en nuestra plataforma, incluyendo nombre, 
            correo electrónico, número de teléfono y otra información necesaria para proporcionar nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Uso de la Información</h2>
          <p className="text-muted-foreground">
            Utilizamos su información personal para:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Proporcionar y mejorar nuestros servicios</li>
            <li>Comunicarnos con usted sobre su cuenta y nuestros servicios</li>
            <li>Procesar transacciones</li>
            <li>Enviar actualizaciones y ofertas promocionales (con su consentimiento)</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. Compartir Información</h2>
          <p className="text-muted-foreground">
            No vendemos ni alquilamos su información personal a terceros. Podemos compartir su información con:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Proveedores de servicios que nos ayudan a operar nuestra plataforma</li>
            <li>Autoridades legales cuando sea requerido por ley</li>
            <li>Otras partes de transacciones (propietarios e inquilinos) según sea necesario</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Seguridad de Datos</h2>
          <p className="text-muted-foreground">
            Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal 
            contra acceso no autorizado, pérdida o alteración. Sin embargo, ningún sistema es completamente seguro 
            y no podemos garantizar la seguridad absoluta de su información.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Cookies y Tecnologías Similares</h2>
          <p className="text-muted-foreground">
            Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma, 
            analizar el uso del sitio y personalizar el contenido. Puede configurar su navegador para rechazar 
            cookies, pero esto puede afectar la funcionalidad de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Sus Derechos</h2>
          <p className="text-muted-foreground">
            Usted tiene derecho a:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Acceder a su información personal</li>
            <li>Corregir información inexacta</li>
            <li>Solicitar la eliminación de su información</li>
            <li>Oponerse al procesamiento de su información</li>
            <li>Retirar su consentimiento en cualquier momento</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Retención de Datos</h2>
          <p className="text-muted-foreground">
            Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos 
            descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">8. Cambios a Esta Política</h2>
          <p className="text-muted-foreground">
            Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios 
            significativos publicando la nueva política en nuestra plataforma y actualizando la fecha de 
            "Última actualización".
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">9. Contacto</h2>
          <p className="text-muted-foreground">
            Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, contáctenos en:
          </p>
          <p className="text-muted-foreground mt-2">
            Email: administracion@tulumrentalhomes.com.mx<br />
            Teléfono: +52 984 321 3385
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-8">
          Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
