import axios from 'axios';
import useSWR from 'swr';
import {baseFetcher} from '@builtbymom/web3/utils';

import type {SWRResponse} from 'swr';
import type {z} from 'zod';

type TUseZodProps<T> = {
	endpoint: string | null;
	schema: z.ZodSchema;
	config?: Parameters<typeof useSWR<T>>[2];
};

export function useFetch<T>({endpoint, schema, config}: TUseZodProps<T>): SWRResponse<T> & {isSuccess: boolean} {
	const result = useSWR<T>(endpoint, baseFetcher, {
		revalidateOnFocus: false,
		...config
	});

	if (!result.data || result.isLoading || result.isValidating) {
		return {...result, isSuccess: false};
	}

	if (result.error) {
		console.error(endpoint, result.error);
		return {...result, isSuccess: false};
	}

	const parsedData = schema.safeParse(result.data);

	if (!parsedData.success) {
		console.error(endpoint, parsedData.error);
		return {...result, isSuccess: false};
	}

	return {...result, data: parsedData.data, isSuccess: true};
}

export async function fetcher<T>({endpoint, schema}: TUseZodProps<T>): Promise<{
	data: T | undefined;
	isSuccess: boolean;
}> {
	if (!endpoint) {
		return {data: undefined, isSuccess: false};
	}
	const result = await axios.get(endpoint);

	if (!result.data || result.status !== 200) {
		return {...result, isSuccess: false};
	}

	const parsedData = schema.safeParse(result.data);
	if (!parsedData.success) {
		console.error(endpoint, parsedData.error);
		return {...result, isSuccess: false};
	}

	return {...result, data: parsedData.data, isSuccess: true};
}
