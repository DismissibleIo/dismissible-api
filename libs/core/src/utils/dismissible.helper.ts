import { Injectable } from '@nestjs/common';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { IDismissibleHelper } from './dismissible.helper.interface';

@Injectable()
export class DismissibleHelper implements IDismissibleHelper {
  isDismissed(item: DismissibleItemDto): boolean {
    return item.dismissedAt !== undefined && item.dismissedAt !== null;
  }
}
