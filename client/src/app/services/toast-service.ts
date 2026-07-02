import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastController = inject(ToastController);

  async showToast(message: string, isSuccess: boolean = true) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      cssClass: isSuccess ? 'toast-success' : 'toast-error',
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });

    await toast.present();
  }
}
