import {DI, chai, should, describe, before, it } from './helpers';
import * as fixtures from './fixtures/decorators';

describe('Roles', () => {
    let di = new DI(), instance;

    before(() => {
        di = new DI();
        di.setProjection({ 'decorator.iService': 'decorator.Maz' });
    });

    describe('Accept', () => {
        describe('Without whitelist', () => {
            before(() => {
                instance = di.get('decorator.$foo');
            });

            it('should have dependency', () => {
                instance.service.should.be.instanceOf(fixtures.Maz);
            });
        });

        describe('With whitelist', () => {
            describe('rejected', () => {
                it('should have dependency', () => {
                    (function(){
                        instance = di.get('decorator.$foo', { accept: ['y']});
                    })['should'].throw(`'decorator.maz' has role 'x', which is not whitelisted by 'decorator.$foo`);
                });

            });

            describe('accepted', () => {
                before(() => {
                    instance = di.get('decorator.$foo', { accept: ['x']});
                });

                it('should have dependency', () => {
                    instance.service.should.be.instanceOf(fixtures.Maz);
                });
            });

        });
    });

    describe('Reject', () => {
        it('should throw a reject error', () => {
            (function(){
                instance = di.get('decorator.$Foo', { reject: ['x']});
            })['should'].throw(`decorator.maz' has role 'x', which is blacklisted by 'decorator.$foo`);
        });
    });
});
