const VotingDapp = artifacts.require("./VotingDapp");

const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
require('chai')
	.use(require('chai-as-promised'))
	.should()

contract("VotingDapp", ([creater, candidate1, candidate2, candidate3, candidate4, voter1, voter2, voter3, voter4]) => {
	let votingdapp, name1, name2, name3, name4, candidateInstance1, electionName1, electionName2, election1, election2
	let candidateInstance2, candidateInstance3, candidateInstance4, registrationPeriod, votingPeriod, Id1, Id2
	const sleep = milliseconds => new Promise(done => setTimeout(done, milliseconds));


	before(async () => {
		votingdapp = await VotingDapp.new()
	})  

	describe('deployment', async () => {
		let votingAddress, votingName

		before(async () => {
			votingAddress = votingdapp.address
			votingName = await votingdapp.name()

		})
		it("dapp deploys successfully", async () => {

			assert.notEqual(votingAddress, 0x0)
      		assert.notEqual(votingAddress, '')
      		assert.notEqual(votingAddress, null)
      		assert.notEqual(votingAddress, undefined)
      		console.log("contract address:", votingAddress)
		})
		it("dapp has a name", async () => {
			
			assert.equal(votingName, "Voting Dapp")
		})


	})
	describe('creating an election', async () => { 
		registrationPeriod = 1 // IN MINUTES
		votingPeriod = 1 // IN MINUTES
		Id1 = 1
		Id2 = 2
		electionName1 = "Election1"
		electionName2 = "Election2"


		before(async () => {
			

		})
		it('creates 2 elections', async () => {
			election1 = await votingdapp.createElection(electionName1, registrationPeriod, votingPeriod, {from: creater})
			election2 = await votingdapp.createElection(electionName2, registrationPeriod, votingPeriod, {from: creater})
		})
		it("emits ElectionCreated events", async () => {
			expectEvent(election1, 'ElectionCreated', {
				Id: new BN(1), 
				Name: "Election1", 
				// RegistrationEnd: new BN(1),
				// VotingEnd: new BN(1),
				ElectionStatus: new BN(0)
			});
			expectEvent(election2, 'ElectionCreated', {
				Id: new BN(2), 
				Name: "Election2", 
				// RegistrationEnd: new BN(1),
				// VotingEnd: new BN(1),
				ElectionStatus: new BN(0)
			});
		})
	})

	describe('registering candidates', async () => {
		let candidate1Votes, candidate2Votes	
		before(async () => {
			name1 = "bob"
			name2 = "alice"
			name3 = "tom"
			name4 = "alex"

			candidateInstance1 = await votingdapp.registerCandidate(1, name1, {from: candidate1})
			candidateInstance2 = await votingdapp.registerCandidate(1, name2, {from: candidate2})
			candidateInstance3 = await votingdapp.registerCandidate(2, name3, {from: candidate3})
			candidateInstance4 = await votingdapp.registerCandidate(2, name4, {from: candidate4})
			

		})
		it('allows candidates to register', async () => {
		
		})

		it('emits CandidateRegistered events', async () => {
			console.log("Election 1:")
			expectEvent(candidateInstance1, 'CandidateRegistered', {
				Id: new BN(1), 
				Candidates: ([[name1,candidate1,"0"]])
			});
			console.log('Bob registered')

			expectEvent(candidateInstance2, 'CandidateRegistered', {
				Id: new BN(1), 
				Candidates: ([[name1,candidate1,"0"],[name2,candidate2,"0"]])
			});
			console.log('Alice registered')
			console.log("Election 2:")
			expectEvent(candidateInstance3, 'CandidateRegistered', {
				Id: new BN(2), 
				Candidates: ([[name3,candidate3,"0"]])
			});
			console.log('Tom registered')

			expectEvent(candidateInstance4, 'CandidateRegistered', {
				Id: new BN(2), 
				Candidates: ([[name3,candidate3,"0"],[name4,candidate4,"0"]])
			});
			console.log('Alex registered')
		})

		it("rejects candidates' address from registering twice (same and different name)", async () => {
			await votingdapp.registerCandidate(1, "different name", {from: candidate1}).should.be.rejected
			await votingdapp.registerCandidate(1, name2, {from: candidate2}).should.be.rejected
			await votingdapp.registerCandidate(2, name3, {from: candidate3}).should.be.rejected
			await votingdapp.registerCandidate(2, name4, {from: candidate4}).should.be.rejected
		})

		it("rejects voting before registraion period ends", async () => {
			await votingdapp.vote(1, name1, {from: voter1}).should.be.rejected 
			await votingdapp.vote(1, name2, {from: voter2}).should.be.rejected
			

		})

		it("waits 1 minute for registration period to end", async () => {
			console.log("waiting 1 minute for registration period")
			await sleep(60000)
		}).timeout(65000)
	})
	
	describe("voting", async () => {
		let result1, result2, result3, result4, result5, result6

		it("allows voters to vote", async () => {
			result1 = await votingdapp.vote(1, name1, {from: voter1}) 
			result2 = await votingdapp.vote(1, name1, {from: voter2})
			result3 = await votingdapp.vote(1, name2, {from: voter3})

			
		})
		it('allows candidates of one election to vote in another', async () => {
			await votingdapp.vote(1, name2, {from: candidate3})
			await votingdapp.vote(1, name2, {from: candidate4})
			await votingdapp.vote(2, name3, {from: candidate1})
			await votingdapp.vote(2, name3, {from: candidate2})


		})

		it("allows voters to vote in multiple elections", async () => {
			await votingdapp.vote(2, name4, {from: voter1}) 
			await votingdapp.vote(2, name4, {from: voter2})
			
		})

		it("emits VoteSubmitted events", async () => {

			expectEvent(result1, 'VoteSubmitted', {
				Voter: voter1, 
				Candidates: ([[name1,candidate1,"1"],[name2,candidate2,"0"]])
			});
			// console.log("1 vote for Bob")
			expectEvent(result2, 'VoteSubmitted', {
				Voter: voter2, 
				Candidates: ([[name1,candidate1,"2"],[name2,candidate2,"0"]])
			});
			// console.log("1 vote for Bob")
			expectEvent(result3, 'VoteSubmitted', {
				Voter: voter3, 
				Candidates: ([[name1,candidate1,"2"],[name2,candidate2,"1"]])
			});
			// console.log("1 vote for Alice")
		})

		it("rejects voters address' from voting twice", async () => {
			await votingdapp.vote(1, name1, {from: voter1}).should.be.rejected 
			await votingdapp.vote(1, name2, {from: voter2}).should.be.rejected
			await votingdapp.vote(1, name2, {from: voter3}).should.be.rejected

		})

		it("reject candidates from registering during voting period", async () => {
			await votingdapp.registerCandidate(1, name1, {from: candidate3}).should.be.rejected
			await votingdapp.registerCandidate(1, name2, {from: candidate4}).should.be.rejected

		})

		it("waits 1 minute for voting period to end", async () => {
			console.log("waiting 1 minute for registration period")
			await sleep(60000)
		}).timeout(65000)
	})

	describe("results", async () => {
		let results

		it("rejects voters after voting period", async () => {
			await votingdapp.vote(1, name1, {from: voter1}).should.be.rejected 
			await votingdapp.vote(1, name2, {from: voter2}).should.be.rejected
			await votingdapp.vote(1, name2, {from: voter3}).should.be.rejected

		})

		it("reject candidates from registering during voting period", async () => {
			await votingdapp.registerCandidate(1, name1, {from: candidate3}).should.be.rejected
			await votingdapp.registerCandidate(1, name2, {from: candidate4}).should.be.rejected

		})

		it('Gives results', async () => {
			results = await votingdapp.results(Id1, {from: creater})
			console.log("Election 1 'Winners' array", results.logs[0].args.Winners)
		})

		it('emits ElectionResults event', async () => {
			expectEvent(results, 'ElectionResults', {
				Name: electionName1, 
				Candidates: ([[name1,candidate1,"2"],[name2,candidate2,"3"]]),
				ElectionStatus: new BN(2),
				Winners:[[name2,candidate2,"3"]]
			});
		})

		it('Gives array of highest voted candidates in case of a tie', async () => {
			results =await votingdapp.results(Id2, {from: creater})	
			console.log("Election 2 'Winner' array -- tie", results.logs[0].args.Winners)	


		})
		it("emits ElectionResults event with candidates that tied", async () => {
			expectEvent(results, 'ElectionResults', {
				Name: electionName2, 
				Candidates: [[name3,candidate3,"2"],[name4,candidate4,"2"]],
				ElectionStatus: new BN(2),
				Winners:[[name3,candidate3,"2"],[name4,candidate4,"2"]]
			});
		})


	})
})



























