export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6" data-testid="heading-terms">
        Términos y Condiciones
      </h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Aceptación de Términos</h2>
          <p className="text-muted-foreground">
            Al acceder y utilizar la plataforma Tulum Rental Homes, usted acepta estar sujeto a estos Términos y Condiciones. 
            Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Uso de la Plataforma</h2>
          <p className="text-muted-foreground">
            Nuestra plataforma conecta propietarios de propiedades con potenciales inquilinos y compradores. 
            Los usuarios se comprometen a proporcionar información precisa y actualizada, y a utilizar la plataforma 
            de manera responsable y legal.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. Registro de Usuario</h2>
          <p className="text-muted-foreground">
            Para acceder a ciertas funcionalidades, debe crear una cuenta. Es su responsabilidad mantener 
            la confidencialidad de sus credenciales de acceso y es responsable de todas las actividades 
            realizadas bajo su cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Listados de Propiedades</h2>
          <p className="text-muted-foreground">
            Los propietarios son responsables de la precisión de la información proporcionada en sus listados. 
            Tulum Rental Homes se reserva el derecho de remover listados que violen estos términos o que 
            contengan información falsa o engañosa.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Comisiones y Pagos</h2>
          <p className="text-muted-foreground">
            Las comisiones y tarifas aplicables serán comunicadas claramente antes de completar cualquier transacción. 
            Los pagos deben realizarse según los métodos y plazos establecidos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Limitación de Responsabilidad</h2>
          <p className="text-muted-foreground">
            Tulum Rental Homes actúa como intermediario y no es responsable de las transacciones realizadas 
            entre propietarios e inquilinos/compradores. No garantizamos la disponibilidad, calidad o condición 
            de las propiedades listadas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Propiedad Intelectual</h2>
          <p className="text-muted-foreground">
            Todo el contenido de la plataforma, incluyendo textos, gráficos, logos e imágenes, es propiedad 
            de Tulum Rental Homes o sus licenciantes y está protegido por las leyes de propiedad intelectual.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">8. Modificaciones</h2>
          <p className="text-muted-foreground">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones 
            serán efectivas inmediatamente después de su publicación en la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">9. Contacto</h2>
          <p className="text-muted-foreground">
            Para preguntas sobre estos Términos y Condiciones, puede contactarnos en:
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
