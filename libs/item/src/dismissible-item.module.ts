import { Module } from '@nestjs/common';
import { DismissibleItemFactory } from './dismissible-item.factory';
import { DISMISSIBLE_ITEM_FACTORY } from './dismissible-item.factory.interface';

@Module({
  providers: [
    DismissibleItemFactory,
    { provide: DISMISSIBLE_ITEM_FACTORY, useExisting: DismissibleItemFactory },
  ],
  exports: [DismissibleItemFactory, DISMISSIBLE_ITEM_FACTORY],
})
export class DismissibleItemModule {}
