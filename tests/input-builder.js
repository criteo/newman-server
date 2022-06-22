const CollectionType = {
	None: null,
	Invalid: "invalidCollection",
	ValidStandalone: JSON.stringify(require('./resources/valid-collection.json')),
	ValidWithIterationData: JSON.stringify(require('./resources/valid-collection-with-iteration-data.json'))
}

const DataType = {
	None: null,
	Invalid: "invalidIterationData",
	Valid: JSON.stringify(require('./resources/valid-iteration-data.json')),
	Throwing: JSON.stringify(require('./resources/throwing-iteration-data.json'))
}

class InputBuilder {
    constructor() {
        this.collection = CollectionType.None;
        this.iterationData = DataType.None;
    }

    empty() {
        this.collection = CollectionType.None;
        this.iterationData = DataType.None;
        return this;
    }
    withCollection(collectionType) {
        this.collection = collectionType;
        return this;
    }
    withIterationData(dataType) {
        this.iterationData = dataType;
        return this;
    }
    build() {
        //only add the property if they are set
        return {
        ...(this.collection && { collection: this.collection }),
        ...(this.iterationData && { iterationData: this.iterationData }),
        };
    }
}

module.exports = { InputBuilder, CollectionType, DataType };