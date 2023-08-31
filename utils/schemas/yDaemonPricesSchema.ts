import {addressSchema} from 'utils/schemas/custom/addressSchema';
import {z} from 'zod';

export const yDaemonPriceSchema = z.union([z.string(), z.number()]);

export const yDaemonPricesSchema = z.record(addressSchema, yDaemonPriceSchema);

export type TYDaemonPrice = z.infer<typeof yDaemonPriceSchema>;

export type TYDaemonPrices = z.infer<typeof yDaemonPricesSchema>;
