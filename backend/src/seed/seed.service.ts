import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SeedService {
  private log = new Logger('SeedService');

  async run() {
    this.log.log('Seed disabled — add your own data via API or MongoDB Compass');
  }
}
