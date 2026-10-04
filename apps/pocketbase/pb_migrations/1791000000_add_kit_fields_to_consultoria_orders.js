/// <reference path="../pb_data/types.d.ts" />
// Liga o pedido pago ao problema escolhido (área/subdivisão) e ao Kit de Arranque entregue.
const KIT_FIELDS = ["area", "subdivision", "kit_slug"]

migrate((app) => {
    const collection = app.findCollectionByNameOrId("consultoria_orders")

    for (const name of KIT_FIELDS) {
        collection.fields.add(new Field({
            hidden: false,
            name,
            presentable: false,
            required: false,
            system: false,
            type: "text",
            max: 0,
            min: 0,
            pattern: "",
        }))
    }

    app.save(collection)
}, (app) => {
    const collection = app.findCollectionByNameOrId("consultoria_orders")

    for (const name of KIT_FIELDS) {
        collection.fields.removeByName(name)
    }

    app.save(collection)
})
