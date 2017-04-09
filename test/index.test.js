import {
  expect
} from 'chai';
import {
  TimeCircuits,
  milliToNano,
  nanoToMilli,
} from '../src';


let average;

describe('TimeCircuits', () => {
  it('should instantiate without throwing', () => {
    const wrapper = () => {
      new TimeCircuits();
    };
    expect(wrapper).to.not.throw();
  });

  describe('utilities', () => {
    it('milliToNano', () => {
      expect(milliToNano(1000)).to.equal(1e+9);
      expect(milliToNano(100)).to.equal(1e+8);
      expect(milliToNano(10)).to.equal(1e+7);
    });

    it('nanoToMilli', () => {
      expect(nanoToMilli(1e+9)).to.equal(1000);
      expect(nanoToMilli(1e+8)).to.equal(100);
      expect(nanoToMilli(1e+7)).to.equal(10);
    });
  })

  const intervalMs = 50;
  average = 0;
  for(let i = 0; i < 200; i++) {
    it('should be close to the requested time', (done) => {
      let wasFired = Date.now();
      const intervalNano = milliToNano(intervalMs);

      const timer = new TimeCircuits();
      timer.set(() => {
        wasFired = timer.getTimeSinceStart();

        expect(wasFired).to.be.below(intervalNano + milliToNano(2));
        expect(wasFired).to.be.above(intervalNano - milliToNano(2));

        average += wasFired;
        average = average / (i + 1);

        done();
      }, intervalMs);

      timer.start();
    });
  }

  it('should generally be within ± 2ms of target', () => {
    const averageMs = nanoToMilli(average);
    expect(averageMs).to.be.below(2);
  });

  // describe('options.ignoreMissed', ()=>{
  //   it('should not fire events if ignoreMissed is set and the timeframe is missed', (done)=>{
  //     const timer = new TimeCircuits({ ignoreMissed: true });
  //     let hasFired = false;
  //     // use a time in the past to force a miss
  //     timer.set(()=>{ hasFired = true; }, -500);

  //     timer.start();

  //     setTimeout(()=>{
  //       expect(hasFired).to.equal(false);
  //       done();
  //     }, 500);
  //   });

  //   it('should fire events if ignoreMissed is NOT set and the timeframe is missed', (done)=>{
  //     const timer = new TimeCircuits({ ignoreMissed: false });
  //     let hasFired = false;
  //     // use a time in the past to force a miss
  //     timer.set(()=>{ hasFired = true; }, -500);

  //     timer.start();

  //     setTimeout(()=>{
  //       expect(hasFired).to.equal(true);
  //       done();
  //     }, 500);
  //   });
  // });

});
