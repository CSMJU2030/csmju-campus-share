import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CoreHubIdentity } from '../core-hub-identity';

/** ใช้ใน controller: getListings(@CurrentUser() user: CoreHubIdentity) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CoreHubIdentity | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);