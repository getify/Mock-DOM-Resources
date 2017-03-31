# Mock DOM Resources

A simple utility for mocking the DOM APIs to simulate browser resource preloading and loading.

Resources are not actually loaded. This is a simulation. The request for a resource (i.e. adding a `<script>` element to the mock DOM) is matched up to a delayed firing of a load or error event as if the resource had actually loaded.

For fine grained testing purposes, you can configure all aspects of the simulation, including timings, success/error, and even browser capabilities (preloading, script ordered-async, etc).

**Note:** This is not a spec compliant implementation of a DOM, nor a virtual DOM, nor do we even mock the whole DOM API. The only parts that are mocked are what's minimally necessary for the resource loading simulations.

## License

All code and documentation are (c) 2017 Kyle Simpson and released under the [MIT License](http://getify.mit-license.org/). A copy of the MIT License [is also included](LICENSE.txt).
