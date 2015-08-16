/**
 * Knockout declarations
 */
interface ObservableAny {
    (newValue:any): void;
    (): any;
    subscribe: (callback:(newValue:any) => void) => void;
}

interface ObservableAnyArray {
    (newValue:any[]): void;
    (): any[];
    remove: (value:any) => void;
    removeAll: () => void;
    push: (value:any) => void;
}

interface Knockout {
    observable(value?:any):ObservableAny
    observableArray(value?:any):ObservableAnyArray
    dependentObservable(callback:Function, context:any): any
    applyBindings(context:any):void
    utils:any
    contextFor(element:any): any
}

declare
var ko:Knockout;

/**
 * JQuery declarations
 */
declare var $:any;

function getRandomId(){
    return new Date().getTime() + '' + parseInt(Math.random() * 1000);
}

/**
 * Prototype of a Person
 */
class Person {
    constructor(firstName?:string, middleName?:string, lastName?:string) {
        if(!firstName && !middleName && !lastName){
            return;
        }

        this.firstName(firstName);
        this.middleName(middleName);
        this.lastName(lastName);
        // As I am not deleting the records, following count seems sensible
        this.id(viewModel.people().length + 1);
    }

    public hidden:ObservableAny = ko.observable(false);
    public id:ObservableAny = ko.observable(0);
    public firstName:ObservableAny = ko.observable();
    public middleName:ObservableAny = ko.observable();
    public lastName:ObservableAny = ko.observable();
    public parents = {
        mother: {
            id: ko.observable(),
            fullName: ko.observable()
        },
        father: {
            id: ko.observable(),
            fullName: ko.observable()
        }
    };

    public setDetails(firstName:string, middleName:string, lastName:string, id: number) {
        this.firstName(firstName);
        this.middleName(middleName);
        this.lastName(lastName);
        this.id(id);
    }

    public resetParents() {
        this.parents.mother.id(0);
        this.parents.mother.fullName('');
        this.parents.father.id(0);
        this.parents.father.fullName('');
    }

    public reset() {
        this.firstName('');
        this.middleName('');
        this.lastName('');
        this.resetParents();
    }

    public setParent(parent:any, parentType:string) {
        this.parents[parentType].id(parent.id());
        this.parents[parentType].fullName(parent.fullName());
    }

    public setParentFromPerson(person: Person, parentType: string){
        this.parents[parentType].id(person.id());
        this.parents[parentType].fullName(person.getFullName());
    }

    public openFather() {
        openParent(this.parents.father);
    }

    public  openMother() {
        openParent(this.parents.mother);
    }

    public deleteRecord(data:any, event:any) {
        var context = ko.contextFor(event.target);
        viewModel.people()[context.$index()].hidden(true);
    }

    public setNewRecord(person) {
        this.firstName(person.firstName());
        this.middleName(person.middleName());
        this.lastName(person.lastName());
        this.resetParents();
        for (var parentType in person.parents) {
            this.setParent(person.parents[parentType], parentType);
        }
    }

    public getFullName() {
        return this.firstName() + ' ' + this.lastName();
    }
}

var openParent = function (parent: any) {
    var record = ko.utils.arrayFirst(viewModel.people(), function (person) {
        return person.id() === parent.id();
    });
    if(record){
        openRecord(record);
    }
};

var openRecord = function (record) {
    viewModel.currentRecord.resetParents();
    viewModel.currentRecord.setDetails(record.firstName(), record.middleName(), record.lastName(), record.id());
    for (var parentType in record.parents) {
        viewModel.currentRecord.setParent(record.parents[parentType], parentType);
    }
    $('#viewPersonModal').modal();
};

var newPerson = new Person();

// The view model is an abstract description of the state of the UI, but without any knowledge of the UI technology (HTML)
var viewModel = {
    searchText: ko.observable(''),
    people: ko.observableArray([]),
    parentsSetup: {
        selectedParentType: ko.observable(),
        selectedParent: ko.observable(),
        addParent: function () {
            var parent = viewModel.parentsSetup.selectedParent();
            var parentType = viewModel.parentsSetup.selectedParentType().code;
            newPerson.setParentFromPerson(parent, parentType);
        }
    },
    showAddPersonModal: function () {
        viewModel.formInfo.setCreateMode();
        newPerson.reset();
        $('#addPersonModal').modal();
    },
    addPerson: function () {
        var newRecord = this.newPerson;
        var person;
        if (viewModel.formInfo.createMode) {
            person = new Person(newRecord.firstName(), newRecord.middleName(), newRecord.lastName());

            viewModel.people.push(person);
        } else {
            person = ko.utils.arrayFirst(viewModel.people(), function (person) {
                return person.getFullName() === viewModel.currentRecord.getFullName();
            });
            person.setDetails(newRecord.firstName(), newRecord.middleName(), newRecord.lastName());
            person.resetParents();
        }

        for (var parentType in newRecord.parents) {
            person.setParent(newRecord.parents[parentType], parentType);
        }
        $('#addPersonModal').modal('hide');
    },
    metaInfo: {
        parentTypes: [{name: 'Father', code: 'father'}, {name: 'Mother', code: 'mother'}]
    },
    newPerson: newPerson,
    currentRecord: new Person(),
    editCurrentPerson: function () {
        $('#viewPersonModal').modal('hide');
        viewModel.formInfo.setEditMode();
        newPerson.setNewRecord(viewModel.currentRecord);
        $('#addPersonModal').modal();
    },
    formInfo: {
        saveButtonText: ko.observable(),
        modalTitle: ko.observable(),
        createMode: false,
        setMode: function (editMode) {
            viewModel.formInfo.createMode = !editMode;
            viewModel.formInfo.saveButtonText(editMode ? "Save" : "Add");
            viewModel.formInfo.modalTitle(editMode ? "Update Details" : "Add Person");
        },
        setEditMode: function () {
            this.setMode(true);
        },
        setCreateMode: function () {
            this.setMode(false);
        }
    },
    filterParents: function(){
        return ko.utils.arrayFilter(viewModel.people(), function(person){
            return !person.hidden();
        });
    }
};

var stringStartsWith = function (str:string, startsWith:string) {
    if (startsWith.length > str.length)
        return false;

    return str.substring(0, startsWith.length) === startsWith;
};

viewModel['filteredItems'] = ko.dependentObservable(function () {
    var searchText = this.searchText().toLowerCase();
    if (!searchText) {
        return this.people();
    } else {
        return ko.utils.arrayFilter(this.people(), function (person) {
            return stringStartsWith(person.firstName().toLowerCase(), searchText);
        });
    }
}, viewModel);

// Initializing
viewModel.people([
    new Person("Annabelle", "Jason", "Charlie"),
    new Person("Bertie", "Graham", "Donald"),
    new Person("Charles", "Vennis", "Richard")
]);
viewModel.people()[2].setParentFromPerson(viewModel.people()[0], 'father');
viewModel.people()[1].setParentFromPerson(viewModel.people()[2], 'mother');

ko.applyBindings(viewModel);