import { Ai } from '@cloudflare/ai';
import { Hono } from 'hono';
const app = new Hono();

app.get('/', async (c) => {
	const ai = new Ai(c.env.AI);

	const answer = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
		messages: [{ role: 'user', content: `What is the square root of 9?` }],
	});

	return c.json(answer);
});

app.post('/notes', async (c) => {
	const ai = new Ai(c.env.AI);

	const { text } = await c.req.json();
	if (!text) {
		return c.text('Missing text', 400);
	}

	const { results } = await c.env.DB.prepare('INSERT INTO notes (text) VALUES (?) RETURNING *').bind(text).run();

	const record = results.length ? results[0] : null;

	if (!record) {
		return c.text('Failed to create note', 500);
	}

	const { data } = await ai.run('@cf/baai/bge-base-en-v1.5', { text: [text] });
	const values = data[0];

	if (!values) {
		return c.text('Failed to generate vector embedding', 500);
	}

	const { id } = record;
	const inserted = await c.env.VECTOR_INDEX.upsert([
		{
			id: id.toString(),
			values,
		},
	]);

	return c.json({ id, text, inserted });
});

export default app;
