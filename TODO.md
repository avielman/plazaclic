# Modificar Brand Management para guardar imagen como base64 en JSON

## Tareas Completadas

- [x] Modificar brand-management.ts: Convertir archivo a base64 en onFileSelected, cambiar onSubmit para enviar JSON en lugar de FormData
- [x] Modificar brand.service.ts: Cambiar addBrand y updateBrand para enviar JSON en lugar de FormData
- [x] Modificar server/index.js: Remover multer de rutas de brands, guardar base64 directamente en JSON
- [x] Modificar brand-management.html: Cambiar src de img a brand.imagen (data URL)
- [x] Probar la funcionalidad: Crear, editar, eliminar marca con imagen base64
