# Retrieval Augumented Text Generation

> This code in this repo is a result of following a tutorial on building [Retrieval Augumented Generation AI on Cloudflare](https://developers.cloudflare.com/workers-ai/tutorials/build-a-retrieval-augmented-generation-ai/).

An API that can store notes and respond to questions based on context provided in the notes.

## Usage
1. Log wrangler into your Cloudflare account:
    ```bash
    npx wrangler login
    ```

2. Create an Embeddings Index on Vectorize
    ```bash
    wrangler vectorize create rag-index --dimensions=768 --metric=cosine 
    ```

3. Create a D1 database
    ```bash
    wrangler d1 create rag-database
    ```

    A database ID will be printed to the console. Update `wrangler.toml` with that database id.

4. Create a `notes` table on the D1 database
    ```bash
    wrangler d1 execute rag-database --command "CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, text TEXT NOT NULL)"
    ```

5. Start a local development server
    ```bash
    npx wrangler dev --remote
    ```

    The `--remote` flag is needed, as Workers AI tools are currently not available when workers are run locally.

6. Once the local development server is running, you can add a note by running the following command on a command line.  
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"text": "Text to add"}' http://localhost:8787/notes

    ```

7. Run the following command to prompt the LLM for a response
    ```bash
    curl "http://localhost:8787/?text=prompt"
    ```
    Remember to properly format your prompt.


## Features
`src/index.js` contains the code for a Cloudflare worker that has two routes.

### `/note` 
This route accepts `POST` requests of the following form

```json
{
    "text": "A textual note to create"
}
```

and it

- creates an entry in a Cloudflare D1 database
- creates a text embedding of the received text with the `@cf/baai/bge-base-en-v1.5` model
- creates a Vectorize entry that relates the text embedding and the id of the text in Cloudflare D1

### `/`
This route accepts `GET` requests with a `text` query parameter, and it generates text with relevant
context stored in the D1 database by
- creating a text embedding of the query
- checks Vectorize for entries with similar vector embeddings
- filters returned entries for embeddings that pass a similarity treshold
- queries the D1 for the texts that corresponds to these text embeddings
- provides these texts as context to `@cf/meta/llama-2-7b-chat-int8` to generate a response