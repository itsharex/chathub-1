import { Context } from 'koishi';
import { LanceDB } from "langchain/vectorstores/lancedb";
import { createLogger } from '@dingyi222666/koishi-plugin-chathub/lib/utils/logger';
import type { Table } from 'vectordb';
import path from 'path';
import fs from 'fs/promises';
import { ChatHubPlugin } from '@dingyi222666/koishi-plugin-chathub/lib/services/chat';
import { Config } from '..';

const logger = createLogger('@dingyi222666/chathub-vector-store/lancedb')

export async function apply(ctx: Context, config: Config,
    plugin: ChatHubPlugin) {

    await plugin.registerVectorStoreRetriever("lancedb", async (params) => {
        const embeddings = params.embeddings

        const directory = path.join('data/chathub/vector_store/lancedb', params.key ?? "chathub")

        try {
            await fs.access(directory)
        } catch {
            await fs.mkdir(directory, { recursive: true })
        }

        logger.debug(`Loading lancedb from ${directory}`)


        const client = await (await importLanceDB()).connect(directory)

        const tableNames = await client.tableNames()

        let table: Table<number[]>
        let store: LanceDB

        if (tableNames.some(text => text === "vectors")) {
            table = await client.openTable("vectors")
        } else {
            table = await client.createTable("vectors", [
                { vector: Array(this._config.vectorSize), text: "sample" },
            ]);
        }

        store = await LanceDB.fromTexts(
            ['user:hello'],
            [],
            embeddings,
            { table }
        );

        return store.asRetriever(this._config.topK)
    })
}

async function importLanceDB() {
    try {
        const any = await import("vectordb");

        return any;
    } catch (err) {
        logger.error(err);
        throw new Error(
            "Please install vectordb as a dependency with, e.g. `npm install -S vectordb`"
        );
    }
}
