import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AcudienteService {
  private api = inject(ApiService);

  getMisHijos(): Observable<any[]> {
    return this.api.get<any[]>('acudiente/mis-hijos');
  }

  getHijoHistorial(jugadorId: number): Observable<any> {
    return this.api.get<any>(`acudiente/hijos/${jugadorId}/historial`);
  }

  downloadReciboPdf(jugadorId: number, pagoId: number): Observable<Blob> {
    return this.api.getBlob(`acudiente/hijos/${jugadorId}/pagos/${pagoId}/recibo-pdf`);
  }

  downloadComprobante(jugadorId: number, pagoId: number, comprobanteId: number): Observable<Blob> {
    return this.api.getBlob(`acudiente/hijos/${jugadorId}/pagos/${pagoId}/comprobantes/${comprobanteId}/download`);
  }
}
