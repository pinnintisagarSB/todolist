<script>
import Data from "./Data.svelte";
import Footer from "./Footer.svelte";
import Quiz from "./Quiz.svelte";
 let d,da,dt,date, state, arr = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let t = document.getElementById('t');
setInterval(function () {
    d = new Date();
    date = d.toLocaleDateString(undefined, arr);
    if (d.getHours() >= 12) {
        state = 'PM';
    }
    else {
        state = 'AM';
    }
    da =d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()+ " " + state;
    dt=date;
}, 100);
let x=1;
let sb = "Play Quiz";
</script>

<style>

</style>

<body>
	<div class="top">
		<h2>ToDo's WebList</h2>
		<button id="qz" on:click={()=>{
			console.log("clicked");
			if(x==1){
				sb = "Home";
				return x=0;
			}
			else{
				sb = "Play Quiz";
				return x=1;
			}
		}}>{sb}</button>
	</div>
	{#if x!=0}
	<div class="time">
		<p id="t">{dt}<br>{da}</p>
	</div>
     <Data/>
    <Footer/>
	{:else}
	<Quiz/>
	{/if}
</body>