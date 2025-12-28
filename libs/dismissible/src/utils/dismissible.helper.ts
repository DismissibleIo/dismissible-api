import { Injectable } from '@nestjs/common';
import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';

@Injectable()
export class DismissibleHelper {
  isDismissed(item: DismissibleItemDto): boolean {
    return item.dismissedAt !== undefined && item.dismissedAt !== null;
  }
}
