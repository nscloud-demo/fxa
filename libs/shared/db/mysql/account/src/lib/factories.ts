/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { v4 as uuidv4 } from 'uuid';

import { faker } from '@faker-js/faker';

import { NewCart } from './associated-types';
import { CartState } from './keysley-types';

export const CartFactory = (override?: Partial<NewCart>): NewCart => ({
  id: Buffer.from(uuidv4(), 'hex'),
  state: CartState.START,
  offeringConfigId: faker.helpers.arrayElement([
    'vpn',
    'relay-phone',
    'relay-email',
    'hubs',
    'mdnplus',
  ]),
  interval: faker.helpers.arrayElement([
    'daily',
    'monthly',
    'semiannually',
    'annually',
  ]),
  createdAt: faker.date.recent().getTime(),
  updatedAt: faker.date.recent().getTime(),
  amount: faker.number.int(10000),
  version: 0,
  ...override,
});
