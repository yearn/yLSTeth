import {addressSchema} from 'utils/schemas/custom/addressSchema';
import {z} from 'zod';

export const yDaemonPriceSchema = z.string();

export const yDaemonPricesSchema = z.record(addressSchema, yDaemonPriceSchema);

export type TYDaemonPrice = z.infer<typeof yDaemonPriceSchema>;

export type TYDaemonPrices = z.infer<typeof yDaemonPricesSchema>;
