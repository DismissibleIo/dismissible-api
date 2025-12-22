import { Module } from '@nestjs/common';
import { DismissibleItemFactory } from './dismissible-item.factory';

@Module({
  providers: [DismissibleItemFactory],
  exports: [DismissibleItemFactory],
})
export class DismissibleItemModule {}
