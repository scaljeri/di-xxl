import {DI, chai, should, describe, beforeEach, it} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Constructor parameter', () => {
    let di, instance;

    beforeEach(() => {
        di = new DI();
    });

    describe('As Array', () => {
        beforeEach(() => {
            instance = di.get('decorator.$foo', {params: [1,2,3,4]});
        });

        it('should have received the params', () => {
           instance.args.length.should.equals(4);

           instance.args[0].should.equals(1);
           instance.args[1].should.equals(2);
           instance.args[2].should.equals(3);
           instance.args[3].should.equals(4);
        });
    });

    describe('As Object', () => {
        beforeEach(() => {
            instance = di.get('decorator.booargs', {params: {val1: 3, val2: 4}});
        });

        it('should have received the params', () => {
            instance.val1.should.equals(3);
            instance.val2.should.equals(4);
        });

        describe('Width destructuring', ()=> {
            beforeEach(() => {
                instance = di.get('DecoratorZoo', {params: {name: 'Jeanluca', age: 30}});
            });

            it('should have passed in the arguments', () => {
                instance.name.should.equal('Jeanluca');
                instance.age.should.equal(30);
            });
        });

        /*
        describe('With inspect', () => {
            before(() => {
                instance = di.get('decorator.booargs', {params: {val1: 3, val2: 4}});
            });

            it('should have received the params', () => {
                instance.val1.should.equals(3);
                instance.val2.should.equals(4);
            });
        });
        */
    });


});
