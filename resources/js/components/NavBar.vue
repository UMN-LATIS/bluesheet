<template>
    <div class="region--masthead-fourth--wrapper">
        <div class="region region--masthead-fourth clearfix" id="masthead-fourth">
            <div class="region__inner">

                <nav role="navigation" aria-labelledby="block-groupmenus-menu" id="block-groupmenus"
                    data-block-plugin-id="groupmenus"
                    class="block block-menu navigation header-menu groupmenu--header-menu">

                    <h2 class="visually-hidden" id="block-groupmenus-menu">Group Navigation</h2>

                    <div class="header-menu--toggle">
                        <span class="header-menu--toggle--label">Menu</span>
                        <svg class="svg-inline--fa fa-bars fa-w-14 header-menu--toggle--accent" aria-hidden="true"
                            focusable="false" data-prefix="fas" data-icon="bars" role="img"
                            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg="">
                            <path fill="currentColor"
                                d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z">
                            </path>
                        </svg><!-- <span class="header-menu--toggle--accent fas fa-bars"></span> -->
                    </div>

                    <div class="header-menu--menu-wrapper">

                        <ul class="menu menu-level--1">
                            <slot></slot>
                        </ul>

                    </div>

                </nav>
            </div>
        </div>
    </div>

</template>
<script>
    export default {

    }

</script>
