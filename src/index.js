import { Ai } from '@cloudflare/ai';

export default {
	async fetch(request, env, ctx) {
		const ai = new Ai(env.AI);

		const answer = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
			messages: [{ role: 'user', content: `What is the square root of 9?` }],
		});

		return new Response(JSON.stringify(answer));
	},
};
