import { DynamicModule, Module } from '@nuclei/core';

import { MoreNestModule } from './more-nest';
import { NestService } from './nest.service';

@Module()
export class NestModule {

	// @TODO: Fix dynamic modules
	public static async forRoot(): Promise<DynamicModule> {
		return {
			module: NestModule,
			imports: [MoreNestModule],
			providers: [
				NestService,
			],
			exports: [
				MoreNestModule,
				NestService,
			],
		};
	}

}
