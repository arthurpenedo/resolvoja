/// <reference path="../pb_data/types.d.ts" />
// Downloads de Kit de Arranque feitos por assinantes: cada linha consome 1 da cota do mês
// (Essencial 3, Pro 8). Só a API grava (superusuário); o usuário só lê os próprios.
migrate(
    (app) => {
        const texto = (id, name) => ({
            hidden: false, id, max: 0, min: 0, name, pattern: "", presentable: false,
            primaryKey: false, required: true, system: false, type: "text",
        });
        const collection = new Collection({
            type: "base",
            name: "kit_downloads",
            createRule: null,
            listRule: "@request.auth.id != '' && userId = @request.auth.id",
            viewRule: "@request.auth.id != '' && userId = @request.auth.id",
            updateRule: null,
            deleteRule: null,
            fields: [
                {
                    autogeneratePattern: "[a-z0-9]{15}", hidden: false, id: "text3208210256", max: 15, min: 15,
                    name: "id", pattern: "^[a-z0-9]+$", presentable: false, primaryKey: true, required: true,
                    system: true, type: "text",
                },
                texto("text1200000001", "userId"),
                texto("text1200000002", "subdivision"),
                texto("text1200000003", "kit_slug"),
                texto("text1200000004", "periodo"),
                texto("text1200000005", "plano"),
                { hidden: false, id: "autodate1200000006", name: "created", onCreate: true, onUpdate: false, presentable: false, system: false, type: "autodate" },
            ],
            indexes: [
                "CREATE UNIQUE INDEX idx_kit_downloads_unico ON kit_downloads (userId, periodo, subdivision)",
                "CREATE INDEX idx_kit_downloads_mes ON kit_downloads (userId, periodo)",
            ],
        });
        return app.save(collection);
    },
    (app) => {
        const collection = app.findCollectionByNameOrId("kit_downloads");
        return app.delete(collection);
    },
);
