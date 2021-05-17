<script>
    let arrStr,str="";
    let arr = [];
    let t,d;
function addData(t,d){
    console.log("Adding Item")
    if (localStorage.getItem('items') == null) {
        arr.push([t, d]);
        localStorage.setItem('items', JSON.stringify(arr));
    }
    else {
        arrStr = localStorage.getItem('items');
        arr = JSON.parse(arrStr);
        arr.push([t, d]);
        localStorage.setItem('items', JSON.stringify(arr));
    }
}
window.onload = function (){
        arrStr = localStorage.getItem('items');
        arr = JSON.parse(arrStr);
        localStorage.setItem('items', JSON.stringify(arr));
}
</script>

<style>

</style>

<div class="data">
    <div class="container">
        <h3>Title</h3>
        <input type="text" id="title" placeholder="" bind:value={t}>
        <h3>Description</h3>
        <textarea type="text" placeholder="" id="desc" bind:value={d}></textarea>
        <div class="but">
            <button id="add" on:click={addData(t,d)}>Add Item</button>
            <button id="clearstorage" on:click={()=>{
                console.log("List Cleared");
                arr=[];
            }}>Clear List</button>
        </div>
    </div>
    <table class="do-list scroll">
        <thead>
            <tr>
                <th>Sno.</th>
                <th>Title</th>
                <th>Description</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody id="tb">
            {#each arr as a}
            <tr>
                <th>{arr.indexOf(a)+1}</th>
                <th>{a[0]}</th>
                <th>{a[1]}</th>
                <th><button id="clc" on:click={()=>{
                    console.log("Task Deleted");
                       arrStr = localStorage.getItem('items');
                       arr = JSON.parse(arrStr);
                       arr.splice(a[0], 1);
                      localStorage.setItem('items', JSON.stringify(arr));
                }}>Delete</button></th>
            </tr>
            {/each}
        </tbody>
    </table>
</div>