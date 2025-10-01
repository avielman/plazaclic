import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      userType: ['cliente', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.toastService.showToast('Registro', 'Éxito', 'Registro exitoso!', 'fa-solid fa-check', 'bg-success');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error(err);
          this.toastService.showToast('Registro', 'Error', 'Error en el registro: ' + err.error.message, 'fa-solid fa-exclamation-triangle', 'bg-danger');
        }
      });
    }
  }
}

