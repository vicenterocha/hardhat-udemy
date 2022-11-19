import logo from './logo.svg';
import './App.css';
import React from "react";
import {ethers} from 'ethers';
import Lottery from './contracts/Lottery.json';
import contractAddress from './contracts/contract-address.json';


class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
       manager: '',
       players: [],
       lotteryBalance: ethers.BigNumber.from("0"),
       value: '',
       message: ''
    };
  }

  async componentDidMount() {
    // Get Provider
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    // Get the contract using the Provider
    this._lottery = new ethers.Contract(contractAddress.Lottery, Lottery.abi, this._provider.getSigner(0));

    // Get the manager from the contract
    const manager = await this._lottery.manager();
    const players = await this._lottery.getPlayers();
    const lotteryBalance = await this._provider.getBalance(this._lottery.address);

    this.setState({ manager, players, lotteryBalance });
  
  }

  onSubmit = async (event) => {
    event.preventDefault();

    const accounts = await this._provider.listAccounts();

    this.setState({ message: 'Waiting on transaction success...'});

    const transactionReceipt = await this._lottery.enter( { value: ethers.utils.parseEther(this.state.value)} );
    await transactionReceipt.wait(1);
    
    this.setState({ message: 'You have been entered...'});
  }

  onPickWinner = async () => {
    const accounts = await this._provider.listAccounts();

    this.setState({ message: 'Waiting on transaction success...'});

    const transactionReceipt = await this._lottery.pickWinner();
    await transactionReceipt.wait(1);
    
    this.setState({ message: 'The winner is has been picked!'});
  }

  render() {
    return (
      <div>
        <h2>Lottery Contract</h2>
        <p>This contract is managed by {this.state.manager}</p>
        <br/>
        <p>Current lottery value is {ethers.utils.formatEther(this.state.lotteryBalance)}!</p>
        <p>This are the currently {this.state.players.length} players in the lottery.</p>
      <hr/>

      <form onSubmit={this.onSubmit}>
        <h4>Want to try your luck?</h4>
        <div>
          <label>Amount of ether to enter</label>
          <input
          value={this.state.value}
            onChange={event => this.setState({ value: event.target.value })}
          ></input>
        </div>
        <button>Enter!</button>
      </form>

      <hr />

      <h4>Ready to pick a winner?</h4>
      <button onClick={this.onPickWinner}>Pick a winner</button>

      <hr/>
      
      <h1>{this.state.message}</h1>
      
      </div>
    );
  }
}
export default App;
