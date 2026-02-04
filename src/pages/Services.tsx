import { PublicLayout } from '@/components/PublicLayout';
import { useServices } from '@/hooks/useServices';
import { ServiceCard } from '@/components/ServiceCard';

export default function ServicesPage() {
  const { services, loading } = useServices();
  const activeServices = services.filter(s => s.is_active);

  return (
    <PublicLayout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Nuestros Servicios
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Elige el servicio perfecto para ti y luce unas uñas increíbles
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}

          {!loading && activeServices.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Próximamente agregaremos nuestros servicios
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
