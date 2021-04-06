/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AbsoluteFsPath} from '../../file_system';
import {TraitCompiler} from '../../transform';
import {FileTypeCheckingData} from '../../typecheck/src/checker';
import {SemanticDepGraph} from '../semantic_graph';

import {FileDependencyGraph} from './dependency_tracking';

/**
 * Discriminant of the `IncrementalState` union.
 */
export enum IncrementalStateKind {
  Fresh,
  Delta,
  Analyzed,
}

/**
 * Placeholder state for a fresh compilation that has never been successfully analyzed.
 */
export interface FreshIncrementalState {
  kind: IncrementalStateKind.Fresh;
}

/**
 * State captured from a compilation that completed analysis successfully, that can serve as a
 * starting point for a future incremental build.
 */
export interface AnalyzedIncrementalState {
  kind: IncrementalStateKind.Analyzed;

  /**
   * Dependency graph extracted from the build, to be used to determine the logical impact of
   * physical file changes.
   */
  depGraph: FileDependencyGraph;

  /**
   * The semantic dependency graph from the build.
   *
   * This is used to perform in-depth comparison of Angular decorated classes, to determine
   * which files have to be re-emitted and/or re-type-checked.
   */
  semanticDepGraph: SemanticDepGraph;

  /**
   * `TraitCompiler` which contains records of all analyzed classes within the build.
   */
  traitCompiler: TraitCompiler;

  /**
   * All generated template type-checking files produced as part of this compilation, or `null` if
   * type-checking was not (yet) performed.
   */
  typeCheckResults: Map<AbsoluteFsPath, FileTypeCheckingData>|null;

  /**
   * Cumulative set of source file paths which were definitively emitted by this compilation or
   * carried forward from a prior one.
   */
  emitted: Set<AbsoluteFsPath>;
}

/**
 * Incremental state for a compilation that has not been successfully analyzed, but that can be
 * based on a previous compilation which was.
 *
 * This is the state produced by an incremeental compilation until its own analysis succeeds. If
 * analysis fails, this state carries forward information about which files have changed since the
 * last successful build (the `lastAnalyzedState`), so that the next incremental build can consider
 * the total delta between the `lastAnalyzedState` and the current program in its incremental
 * analysis.
 */
export interface DeltaIncrementalState {
  kind: IncrementalStateKind.Delta;

  /**
   * If available, the `AnalyzedIncrementalState` for the most recent ancestor of the current
   * program which was successfully analyzed.
   */
  lastAnalyzedState: AnalyzedIncrementalState;

  /**
   * Set of file paths which have changed since the `lastAnalyzedState` compilation.
   */
  physicallyChangedTsFiles: Set<AbsoluteFsPath>;

  /**
   * Set of resource file paths which have changed since the `lastAnalyzedState` compilation.
   */
  changedResourceFiles: Set<AbsoluteFsPath>;
}

/**
 * State produced by a compilation that's usable as the starting point for a subsequent compilation.
 *
 * Discriminated by the `IncrementalStateKind` enum.
 */
export type IncrementalState = AnalyzedIncrementalState|DeltaIncrementalState|FreshIncrementalState;
