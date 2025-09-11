import { CompanyService } from './../../services/company';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgModule, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Company } from '../../models/company.model';


@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.html',
  styleUrls: ['./company-management.css'],
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CompanyManagement implements OnInit {
  companyForm!: FormGroup;
  isAuthorized = false;
  passwordInput = 'admin123';
  authError = '';
  clients: any[] = [];
  paginatedClients: any[] = [];
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  showModal = false;
  actividadComercial: any[] = [];
  actividades = signal([
    { "activityName": "Consultoría de marketing digital", "isActive": false },
    { "activityName": "Servicios de contabilidad y auditoría", "isActive": false },
    { "activityName": "Asesoría legal", "isActive": false },
    { "activityName": "Consultoría financiera", "isActive": false },
    { "activityName": "Diseño gráfico y branding", "isActive": false },
    { "activityName": "Desarrollo de software a medida", "isActive": false },
    { "activityName": "Creación de sitios web", "isActive": false },
    { "activityName": "Gestión de redes sociales", "isActive": false },
    { "activityName": "Traducción e interpretación", "isActive": false },
    { "activityName": "Servicios de recursos humanos y reclutamiento", "isActive": false },
    { "activityName": "Fotografía y videografía profesional", "isActive": false },
    { "activityName": "Planificación de eventos", "isActive": false },
    { "activityName": "Coaching empresarial", "isActive": false },
    { "activityName": "Servicios de arquitectura y diseño de interiores", "isActive": false },
    { "activityName": "Redacción y edición de contenido", "isActive": false },
    { "activityName": "Servicios de seguridad informática", "isActive": false },
    { "activityName": "Análisis de datos", "isActive": false },
    { "activityName": "Mantenimiento de equipos de oficina", "isActive": false },
    { "activityName": "Capacitación y talleres", "isActive": false },
    { "activityName": "Consultoría de sostenibilidad", "isActive": false },
    { "activityName": "Venta de ropa y accesorios", "isActive": false },
    { "activityName": "Tienda de calzado", "isActive": false },
    { "activityName": "Joyería", "isActive": false },
    { "activityName": "Venta de productos electrónicos", "isActive": false },
    { "activityName": "Venta de artículos para el hogar", "isActive": false },
    { "activityName": "Librería y papelería", "isActive": false },
    { "activityName": "Juguetería", "isActive": false },
    { "activityName": "Venta de artículos deportivos", "isActive": false },
    { "activityName": "Supermercado", "isActive": false },
    { "activityName": "Tienda de conveniencia", "isActive": false },
    { "activityName": "Farmacia", "isActive": false },
    { "activityName": "Venta de productos orgánicos", "isActive": false },
    { "activityName": "Tienda de mascotas", "isActive": false },
    { "activityName": "Floristería", "isActive": false },
    { "activityName": "Venta de muebles", "isActive": false },
    { "activityName": "Tienda de herramientas y ferretería", "isActive": false },
        { "activityName": "Venta de antigüedades", "isActive": false },
    { "activityName": "Venta de café y té", "isActive": false },
    { "activityName": "Venta de productos de belleza y cuidado personal", "isActive": false },
    { "activityName": "Venta de instrumentos musicales", "isActive": false },
    { "activityName": "Fabricación de joyería artesanal", "isActive": false },
    { "activityName": "Cerámica y alfarería", "isActive": false },
    { "activityName": "Textiles y tejidos", "isActive": false },
    { "activityName": "Productos de cuero", "isActive": false },
    { "activityName": "Velas aromáticas", "isActive": false },
    { "activityName": "Jabones artesanales", "isActive": false },
    { "activityName": "Objetos de decoración", "isActive": false },
    { "activityName": "Dulces y repostería artesanal", "isActive": false },
    { "activityName": "Marcos y cuadros", "isActive": false },
    { "activityName": "Artesanía en madera", "isActive": false },
    { "activityName": "Productos de vidrio soplado", "isActive": false },
    { "activityName": "Lámparas decorativas", "isActive": false },
    { "activityName": "Mermeladas y conservas", "isActive": false },
    { "activityName": "Mantenimiento de hardware y software", "isActive": false },
    { "activityName": "Desarrollo de aplicaciones móviles", "isActive": false },
    { "activityName": "Cloud computing y servicios de hosting", "isActive": false },
    { "activityName": "Ciberseguridad", "isActive": false },
    { "activityName": "Soporte técnico", "isActive": false },
    { "activityName": "Venta de equipos y periféricos", "isActive": false },
    { "activityName": "Desarrollo de videojuegos", "isActive": false },
    { "activityName": "Servicios de inteligencia artificial", "isActive": false },
    { "activityName": "Big Data", "isActive": false },
    { "activityName": "Realidad virtual y aumentada", "isActive": false },
    { "activityName": "Soluciones de comercio electrónico", "isActive": false },
    { "activityName": "Sistemas de punto de venta (POS)", "isActive": false },
    { "activityName": "Servicios de internet de las cosas (IoT)", "isActive": false },
    { "activityName": "Fisioterapia", "isActive": false },
    { "activityName": "Nutrición", "isActive": false },
    { "activityName": "Psicología", "isActive": false },
    { "activityName": "Masajes terapéuticos", "isActive": false },
    { "activityName": "Centros de yoga y meditación", "isActive": false },
    { "activityName": "Gimnasios", "isActive": false },
    { "activityName": "Terapias alternativas", "isActive": false },
    { "activityName": "Servicios de spa y cuidado personal", "isActive": false },
    { "activityName": "Acupuntura", "isActive": false },
    { "activityName": "Entrenadores personales", "isActive": false },
    { "activityName": "Asesoría de imagen", "isActive": false },
    { "activityName": "Plomería", "isActive": false },
    { "activityName": "Electricidad", "isActive": false },
    { "activityName": "Carpintería", "isActive": false },
    { "activityName": "Pintura", "isActive": false },
    { "activityName": "Jardinería y paisajismo", "isActive": false },
    { "activityName": "Herrería", "isActive": false },
    { "activityName": "Reparación de electrodomésticos", "isActive": false },
    { "activityName": "Reparación de automóviles", "isActive": false },
    { "activityName": "Remodelación de interiores y exteriores", "isActive": false },
    { "activityName": "Limpieza de edificios", "isActive": false },
    { "activityName": "Restaurante", "isActive": false },
    { "activityName": "Bar y cafetería", "isActive": false },
    { "activityName": "Catering", "isActive": false },
    { "activityName": "Panadería y pastelería", "isActive": false },
    { "activityName": "Venta de productos gourmet", "isActive": false },
    { "activityName": "Producción de cerveza artesanal", "isActive": false },
    { "activityName": "Venta de jugos y batidos naturales", "isActive": false },
    { "activityName": "Food trucks", "isActive": false },
    { "activityName": "Producción de vino", "isActive": false },
    { "activityName": "Heladería", "isActive": false },
    { "activityName": "Tienda de delicatessen", "isActive": false },
    { "activityName": "Academias de idiomas", "isActive": false },
    { "activityName": "Clases de música", "isActive": false },
    { "activityName": "Escuelas de arte", "isActive": false },
    { "activityName": "Agencias de viajes", "isActive": false },
    { "activityName": "Guías turísticos", "isActive": false },
    { "activityName": "Organizadores de tours y excursiones", "isActive": false },
    { "activityName": "Servicios de fotografía y video", "isActive": false },
    { "activityName": "Alquiler de material deportivo", "isActive": false },
    { "activityName": "Cursos de programación", "isActive": false },
    { "activityName": "Tutorías escolares", "isActive": false },
    { "activityName": "Campamentos de verano", "isActive": false },
    { "activityName": "Fabricación de textiles", "isActive": false },
    { "activityName": "Producción de productos químicos", "isActive": false },
    { "activityName": "Ensamblaje de componentes electrónicos", "isActive": false },
    { "activityName": "Manufactura de alimentos y bebidas", "isActive": false },
    { "activityName": "Producción de maquinaria industrial", "isActive": false },
    { "activityName": "Hoteles y alojamientos", "isActive": false },
    { "activityName": "Servicios de alojamiento temporal", "isActive": false },
    { "activityName": "Agencias de viajes y tour operadores", "isActive": false },
    { "activityName": "Servicios de catering y banquetes", "isActive": false },
    { "activityName": "Servicios de transporte terrestre de carga", "isActive": false },
    { "activityName": "Servicios de transporte aéreo", "isActive": false },
    { "activityName": "Servicios de transporte marítimo", "isActive": false },
    { "activityName": "Almacenamiento y bodegaje", "isActive": false },
    { "activityName": "Gestión de cadenas de suministro", "isActive": false },
    { "activityName": "Cultivo de productos agrícolas", "isActive": false },
    { "activityName": "Ganadería", "isActive": false },
    { "activityName": "Producción de lácteos", "isActive": false },
    { "activityName": "Pesca y acuicultura", "isActive": false },
    { "activityName": "Servicios de fumigación y control de plagas", "isActive": false },
    { "activityName": "Banca", "isActive": false },
    { "activityName": "Servicios de seguros", "isActive": false },
    { "activityName": "Inversiones y gestión de activos", "isActive": false },
    { "activityName": "Préstamos y créditos", "isActive": false },
    { "activityName": "Asesoría financiera", "isActive": false },
    { "activityName": "Venta y alquiler de propiedades", "isActive": false },
    { "activityName": "Administración de propiedades", "isActive": false },
    { "activityName": "Corretaje de bienes raíces", "isActive": false },
    { "activityName": "Tasación de inmuebles", "isActive": false },
    { "activityName": "Desarrollo de proyectos inmobiliarios", "isActive": false },
    { "activityName": "Producción de películas y televisión", "isActive": false },
    { "activityName": "Medios de comunicación", "isActive": false },
    { "activityName": "Música y artes escénicas", "isActive": false },
    { "activityName": "Gestión de eventos y festivales", "isActive": false },
    { "activityName": "Parques de atracciones y temáticos", "isActive": false },
    { "activityName": "Tintorería y lavandería", "isActive": false },
    { "activityName": "Servicios de mensajería y paquetería", "isActive": false },
    { "activityName": "Venta y alquiler de inmuebles", "isActive": false },
    { "activityName": "Cuidado de niños y ancianos", "isActive": false },
    { "activityName": "Estaciones de servicio", "isActive": false },
    { "activityName": "Servicios funerarios", "isActive": false },
    { "activityName": "Venta de flores y plantas", "isActive": false },
    { "activityName": "Salón de belleza y peluquería", "isActive": false },
    { "activityName": "Mantenimiento de piscinas", "isActive": false },
    { "activityName": "Guarderías", "isActive": false },
    { "activityName": "Servicios de impresión y copistería", "isActive": false },
    { "activityName": "Servicio de transporte de pasajeros", "isActive": false },
    { "activityName": "Mecánica general", "isActive": false }
  ]);
  // Simulación de datos de empresa (puedes reemplazar por servicio real)
  companyData: any = null;
  // Contraseña fija para ejemplo, reemplaza por lógica real
  readonly COMPANY_PASSWORD = 'admin123';

  selectedActividades: string[] = []; // Declaración de la propiedad
  logoPreview: string | ArrayBuffer | null = null; // Added for logo preview
  currentUser: any; // Added currentUser property
  router: Router; // Added router property

  constructor(private fb: FormBuilder, private CompanyService: CompanyService, private authService: AuthService, private _router: Router) {
    this.router = _router; // Initialize router
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    if (!this.currentUser || this.currentUser.userType !== 'proveedor') {
      alert('Acceso denegado. Solo proveedores pueden gestionar la empresa.');
      this.router.navigate(['/']);
      return;
    }

    // Fetch company data for the current user
    this.CompanyService.getCompany(this.currentUser.id).subscribe({
      next: (data) => {
        this.companyData = data;
        this.initForm();
        if (this.companyData.logoBase64) {
          this.logoPreview = this.companyData.logoBase64;
        }
      },
      error: (err) => {
        console.error('Error al cargar datos de la empresa:', err);
        // If no company data exists, initialize form with empty values
        this.initForm();
      }
    });

    this.CompanyService.getActividadComercial().subscribe(data => {
      this.actividadComercial = data;
    });

    // Simulación: cargar clientes (puedes usar servicio real)
    this.clients = [
      // Ejemplo de clientes
      { id: 1, name: 'Juan Pérez', email: 'juan@correo.com', profile: 'Premium', purchaseHistory: '3 compras', preferences: 'Electrónica' },
      { id: 2, name: 'Ana Gómez', email: 'ana@correo.com', profile: 'Estándar', purchaseHistory: '1 compra', preferences: 'Moda' },
      // ...más clientes
    ];
    this.updatePagination();
  }

  initForm() {
    this.companyForm = this.fb.group({
      companyName: [this.companyData?.companyName || '', Validators.required],
      managerName: [this.companyData?.managerName || '', Validators.required],
      dpi: [this.companyData?.dpi || '', Validators.required],
      nit: [this.companyData?.nit || '', Validators.required],
      tradeName: [this.companyData?.tradeName || '', Validators.required],
      businessActivity: [this.companyData?.businessActivity || ''],
      legalName: [this.companyData?.legalName || '', Validators.required],
      whatsapp: [this.companyData?.whatsapp || '', Validators.required],
      facebook: [this.companyData?.facebook || ''],
      youtube: [this.companyData?.youtube || ''],
      instagram: [this.companyData?.instagram || ''],
      x: [this.companyData?.x || ''],
      tiktok: [this.companyData?.tiktok || ''],
      email: [this.companyData?.email || '', [Validators.required, Validators.email]],
      phone: [this.companyData?.phone || '', Validators.required],
      bank: [this.companyData?.bank || '', Validators.required],
      accountType: [this.companyData?.accountType || '', Validators.required],
      accountNumber: [this.companyData?.accountNumber || '', Validators.required],
      logoBase64: [this.companyData?.logoBase64 || ''], // Add logoBase64 to form
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string; // For displaying preview
        this.companyForm.get('logoBase64')?.setValue(reader.result as string); // Set value to form control
      };
      reader.readAsDataURL(file);
    }
  }

  authorize() {
    if (this.passwordInput === this.COMPANY_PASSWORD) {
      this.isAuthorized = true;
      this.authError = '';
      this.closeModal();
    } else {
      this.authError = 'Contraseña incorrecta.';
      this.isAuthorized = false;
    }
  }

  saveCompany() {
    if (this.companyForm.valid) {
      const companyDataToSave: Company = { ...this.companyForm.value };
      companyDataToSave.userId = this.currentUser.id; // Ensure userId is set

      this.CompanyService.updateCompany(companyDataToSave).subscribe({
        next: () => alert('Datos de la empresa guardados correctamente.'),
        error: (err) => alert('Error al guardar los datos en el servidor: ' + (err?.message || JSON.stringify(err)))
      });
    } else {
      alert('Por favor, complete todos los campos obligatorios.');
    }
  }

  // Paginación
  updatePagination() {
    this.totalPages = Math.ceil(this.clients.length / this.pageSize) || 1;
    this.paginatedClients = this.clients.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  showBankModal() {
    this.showModal = true;
    this.authError = '';
    this.passwordInput = '';
  }

  closeModal() {
    this.showModal = false;
    this.passwordInput = '';
    this.authError = '';
  }

  // Add this method to handle checkbox changes for actividadComercial
  onActividadChange(event: Event, actividad: any): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedActividades.includes(actividad)) {
        this.selectedActividades.push(actividad);
      }
    } else {
      this.selectedActividades = this.selectedActividades.filter(a => a !== actividad);
    }
  }

  // Ejemplo de función con tipado explícito
  agregarActividad(a: string) {
    this.selectedActividades.push(a);
  }

  toggleActividad(actividad: any) {
    this.actividades.update(activities =>
      activities.map(act =>
        act.activityName === actividad.activityName ? { ...act, isActive: !act.isActive } : act
      )
    );
  }

  // Use trackBy for better performance with ngFor
  trackByFn(index: number, item: any) {
    return item.activityName;
  }

  showActividadComercialModal = false;

  showActividadModal() {
    this.showActividadComercialModal = true;
  }

  closeActividadModal() {
    this.showActividadComercialModal = false;
  }
}
