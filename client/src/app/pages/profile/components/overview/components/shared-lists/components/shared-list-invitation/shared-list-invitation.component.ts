import { Component, inject, input, OnInit, output } from '@angular/core';
import { SharedListInvitation } from 'src/app/models/SharedList';
import { SharedListsService } from 'src/app/services/shared-lists-service';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-shared-list-invitation',
  templateUrl: './shared-list-invitation.component.html',
  styleUrls: ['./shared-list-invitation.component.scss'],
  imports: [IonButton],
})
export class SharedListInvitationComponent implements OnInit {
  private sharedListService = inject(SharedListsService);

  invitation = input.required<SharedListInvitation>();

  constructor() {}

  ngOnInit() {}

  accept() {
    this.sharedListService
      .acceptInvite(this.invitation().sharedList.sharedListId)
      .subscribe();
  }

  decline() {
    this.sharedListService
      .declineInvite(this.invitation().sharedList.sharedListId)
      .subscribe();
  }
}
