import {DI, chai, should} from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Constructor parameter', () => {
    const di = new DI();
    let instance;

    before(() => {
    });

    describe('As Array', () => {
        before(() => {
            instance = di.getInstance('decorator.$foo', {params: [1,2,3,4]});
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
        before(() => {
            instance = di.getInstance('decorator.booargs', {params: {val1: 3, val2: 4}});
        });

        it('should have received the params', () => {
            instance.val1.should.equals(3);
            instance.val2.should.equals(4);
        });

        /*
        describe('With inspect', () => {
            before(() => {
                instance = di.getInstance('decorator.booargs', {params: {val1: 3, val2: 4}});
            });

            it('should have received the params', () => {
                instance.val1.should.equals(3);
                instance.val2.should.equals(4);
            });
        });
        */
    });


});